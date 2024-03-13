import { Request, Response, NextFunction } from "express";
import { HandleService } from "../handle/handle";
import { MessageResponse } from "../model/service/message.rs..model";
import pool from "../util/db.util";
import { InvalidDataException } from "../exception/invaliddata.exception";
import { loggerUtil } from "../util/logger.util";
import Product from "../model/product/product.model";
import { DataNotFoundException } from "../exception/datanotfound.exception";
import { PermissionsConstant } from "../constant/permissions.const";
import { ForbiddenException } from "../exception/forbidden.exception";
import AuthUtil from "../util/auth.util";
import ProductDAO from "./dao/product.dao";
import ProductStock from "../model/product/product_stock.model";
import StockQueue from "../model/product/stock_queue.model";
import { raw } from "body-parser";
import Stock from "../model/product/stock.model";
import PurchaseDAO from "./dao/purchase.dao";
import { cli } from "winston/lib/winston/config";

export class ProductService {
  async addProduct(req: Request, res: Response) {
    const h = new HandleService("addProduct", req, res);
    const client = await pool.connect();
    try {
      if (
        !AuthUtil.isHavePermission(
          PermissionsConstant.ADD_PRODUCT,
          req.permissions ?? []
        )
      ) {
        throw new ForbiddenException("คุณไม่มีสิทธิ์เพิ่มสินค้า");
      }

      const { product_name, product_desc, product_image, product_price } =
        req.body;
      if (!product_name || !product_desc || !product_image || !product_price) {
        throw new InvalidDataException("กรุณากรอกข้อมูลสินค้าให้ครบถ้วน");
      }

      const queryAddProduct = {
        text: `insert into products (product_name, product_desc, product_image, product_price, create_by) values ($1, $2, $3, $4, $5)`,
        values: [
          product_name,
          product_desc,
          product_image,
          product_price,
          req.user?.id,
        ],
      };
      const inserted = await client.query(queryAddProduct).then((result) => {
        return result.rowCount;
      });

      loggerUtil.info(`inserted products ${inserted} row`);

      h.handleSuccess(new MessageResponse(true, "เพิ่มสินค้าสำเร็จ"));
    } catch (err: any) {
      loggerUtil.error(err);
      h.handleError(err);
    } finally {
      client.release();
    }
  }

  async addProductStock(req: Request, res: Response) {
    const h = new HandleService("addProductStock", req, res);
    const client = await pool.connect();
    try {
      if (
        !AuthUtil.isHavePermission(
          PermissionsConstant.ADD_PRODUCT_STOCK,
          req.permissions ?? []
        )
      ) {
        throw new ForbiddenException("คุณไม่มีสิทธิ์เพิ่มสต็อกสินค้า");
      }

      const { product_id } = req.params;
      const { amount } = req.body;
      if (!product_id || !amount) {
        throw new InvalidDataException("กรุณากรอกข้อมูลสินค้าให้ครบถ้วน");
      }

      const queryaddProductStock = {
        text: `insert into products_history (product_id, qty, qty_remaining, create_by) values ($1, $2, $3, $4)`,
        values: [product_id, amount, amount, req.user?.id],
      };
      const inserted = await client
        .query(queryaddProductStock)
        .then((result) => {
          return result.rowCount;
        });

      loggerUtil.info(`inserted product stock ${inserted} row`);

      h.handleSuccess(new MessageResponse(true, "เพิ่มสต็อกสำเร็จ"));
    } catch (err: any) {
      loggerUtil.error(err);
      h.handleError(err);
    } finally {
      client.release();
    }
  }

  async getProducts(req: Request, res: Response) {
    const h = new HandleService("getProducts", req, res);
    const client = await pool.connect();
    try {
      const { id } = req.params;
      const queryGetProducts = {
        text: `select p.id, p.product_name, p.product_desc, p.product_image, p.product_price
                from products p 
                where p.store_id = $1`,
        values: [id],
      };
      const raw = await client.query(queryGetProducts).then((result) => {
        return result.rows;
      });

      if (raw.length === 0) {
        throw new DataNotFoundException("ไม่พบรายการสินค้า");
      }

      let products: Product[] = [];
      raw.forEach((product) => {
        products.push(
          new Product(
            product.id,
            product.product_name,
            product.product_desc,
            product.product_image,
            product.product_price
          )
        );
      });

      h.handleSuccess(new MessageResponse(true, products));
    } catch (err: any) {
      loggerUtil.error(err);
      h.handleError(err);
    } finally {
      client.release();
    }
  }

  async getProductsTotal(req: Request, res: Response) {
    const h = new HandleService("getProductsTotal", req, res);
    const client = await pool.connect();
    try {
      const { id } = req.params;
      const queryProductsTotal = {
        text: `select count(*) as total from products p where p.store_id = $1`,
        values: [id],
      };
      const raw = await client.query(queryProductsTotal).then((result) => {
        return result.rows;
      });

      h.handleSuccess(new MessageResponse(true, Number.parseInt(raw[0].total)));
    } catch (err: any) {
      loggerUtil.error(err);
      h.handleError(err);
    } finally {
      client.release();
    }
  }

  async purchase(req: Request, res: Response) {
    const h = new HandleService("purchase", req, res);
    const client = await pool.connect();
    try {
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
}

export const productService = new ProductService();
