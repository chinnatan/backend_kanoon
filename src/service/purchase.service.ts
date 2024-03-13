import { Request, Response, NextFunction } from "express";
import { HandleService } from "../handle/handle";
import { MessageResponse } from "../model/service/message.rs..model";
import pool from "../util/db.util";
import { InvalidDataException } from "../exception/invaliddata.exception";
import { loggerUtil } from "../util/logger.util";
import ProductDAO from "./dao/product.dao";
import ProductStock from "../model/product/product_stock.model";
import StockQueue from "../model/product/stock_queue.model";
import Stock from "../model/product/stock.model";
import PurchaseDAO from "./dao/purchase.dao";
import AuthUtil from "../util/auth.util";
import { PermissionsConstant } from "../constant/permissions.const";
import { ForbiddenException } from "../exception/forbidden.exception";
import { DataNotFoundException } from "../exception/datanotfound.exception";

export class PurchaseService {
  async purchase(req: Request, res: Response) {
    const h = new HandleService("purchase", req, res);
    const client = await pool.connect();
    try {
      if (
        !AuthUtil.isHavePermission(
          PermissionsConstant.ADD_PURCHASE,
          req.permissions ?? []
        )
      ) {
        throw new ForbiddenException("คุณไม่มีสิทธิ์ชำระสินค้า");
      }

      await client.query("BEGIN");
      const { orders } = req.body;

      if (orders === null || orders.length === 0) {
        throw new InvalidDataException("กรุณากรอกข้อมูลให้ถูกต้อง");
      }

      const listProductId: number[] = orders.map((x: any) => {
        return Number.parseInt(x.product_id);
      });

      // === ค้นหาสต็อกทั้งหมดด้วย product id === //
      const listProductStocks: ProductStock[] = [];
      for (let id of listProductId) {
        let rawListProductStocks: ProductStock[] | undefined =
          await ProductDAO.getAllStockByProductId(client, id);
        if (rawListProductStocks !== undefined) {
          for (const stock of rawListProductStocks) {
            listProductStocks.push(stock);
          }
        }
      }

      const stockQueue = new StockQueue<number>(listProductStocks.length);

      // เติมสินค้าลงในคิว FIFO
      for (const productId of listProductId) {
        for (const item of listProductStocks) {
          if (item.productId === productId) {
            stockQueue.enqueue(item.id);
          }
        }
      }

      if (stockQueue.isEmpty()) {
        throw new InvalidDataException("สินค้าไม่เพียงพอ");
      }

      // === เก็บข้อมูล order === //
      let purchaseId = await PurchaseDAO.addPurchase(client, req.user?.id ?? 0);
      for (const order of orders) {
        if (purchaseId === -1) {
          throw new InvalidDataException("บันทึกข้อมูลไม่สำเร็จ");
        }

        await PurchaseDAO.addPurchaseHistory(
          client,
          purchaseId,
          order.product_id,
          order.qty
        );
      }

      const remainingStock: Stock[] = [];

      // ตัดสต็อกตามคิว FIFO
      for (const order of orders) {
        while (!stockQueue.isEmpty() && order.qty > 0) {
          const currStockId = stockQueue.dequeue()!;
          const currProductId =
            listProductStocks.find(
              (item) => item.productId === order.product_id
            )?.productId ?? -1;
          const currentStock = listProductStocks.find(
            (item) => item.id === currStockId
          )!;

          if (currProductId === -1) {
            throw new InvalidDataException("สินค้าไม่เพียงพอ");
          }

          if (currentStock.productId == currProductId) {
            // === จำนวนสินค้าทั้งหมด === //
            let totalStock = 0;
            listProductStocks.forEach((item) => {
              if (item.productId === currProductId) {
                totalStock += item.qtyRemaining;
              }
            });

            if (totalStock < order.qty) {
              throw new InvalidDataException("สินค้าไม่เพียงพอ");
            }

            if (currentStock.qtyRemaining > 0 && order.qty > 0) {
              let stockRemaining = currentStock.qtyRemaining - order.qty;
              let orderRemaining = order.qty - currentStock.qtyRemaining;

              if (stockRemaining <= 0) {
                remainingStock.push(new Stock(currStockId, 0));
              } else {
                remainingStock.push(new Stock(currStockId, stockRemaining));
              }

              order.qty = orderRemaining;
            }
          }
        }
      }

      // === อัพเดทสต็อกสินค้า === //
      for (const remain of remainingStock) {
        await ProductDAO.updateProductStock(
          client,
          remain.id,
          req.user?.id ?? 0,
          remain.remaining
        );
      }

      await client.query("COMMIT");
      h.handleSuccess(new MessageResponse(true, "บันทึกข้อมูลสำเร็จ"));
    } catch (err: any) {
      await client.query("ROLLBACK");
      loggerUtil.error(err);
      h.handleError(err);
    } finally {
      client.release();
    }
  }

  async cancelPurchase(req: Request, res: Response) {
    const h = new HandleService("cancelPurchase", req, res);
    const client = await pool.connect();
    try {
      if (
        !AuthUtil.isHavePermission(
          PermissionsConstant.CANCEL_PURCHASE,
          req.permissions ?? []
        )
      ) {
        throw new ForbiddenException("คุณไม่มีสิทธิ์ยกเลิกการชำระสินค้า");
      }

      const { purchase_id } = req.params;

      await client.query("BEGIN");

      const listPurchaseHistory = await PurchaseDAO.getPurchaseHistoryById(
        client,
        Number.parseInt(purchase_id)
      );

      if (listPurchaseHistory.length === 0) {
        throw new DataNotFoundException("ไม่พบใบเสร็จ");
      }

      loggerUtil.info(`listPurchaseHistory : %O`, listPurchaseHistory);

      // === คืนสินค้า === //
      listPurchaseHistory.forEach(async (item) => {
        await ProductDAO.addProductStock(
          client,
          item.productId,
          item.qty,
          req.user?.id ?? -1
        );
      });

      // === ลบใบเสร็จออก === //
      const deleted = await PurchaseDAO.cancelPurchase(
        client,
        Number.parseInt(purchase_id)
      );

      if (deleted === 0) {
        throw new InvalidDataException("ยกเลิกใบเสร็จไม่สำเร็จหรือไม่พบใบเสร็จ")
      }

      await client.query("COMMIT");
      h.handleSuccess(new MessageResponse(true, "ยกเลิกใบเสร็จสำเร็จ"));
    } catch (err: any) {
      await client.query("ROLLBACK");
      loggerUtil.error(err);
      h.handleError(err);
    } finally {
      client.release();
    }
  }
}

export const purchaseService = new PurchaseService();
