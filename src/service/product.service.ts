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
      const { qty } = req.body;
      if (!product_id || !qty) {
        throw new InvalidDataException("กรุณากรอกข้อมูลสินค้าให้ครบถ้วน");
      }

      if (req.user != null) {
        await ProductDAO.addProductStock(
          client,
          Number.parseInt(product_id),
          qty,
          req.user?.id
        );
      }

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
      if (
        !AuthUtil.isHavePermission(
          PermissionsConstant.VIEW_PRODUCT,
          req.permissions ?? []
        )
      ) {
        throw new ForbiddenException("คุณไม่มีสิทธิ์เพิ่มดูสินค้า");
      }

      const { id } = req.params;
      
      const raw = await ProductDAO.getProductByStoreId(
        client,
        Number.parseInt(id)
      );

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
            Number.parseFloat(product.product_price),
            Number.parseInt(product.qty_remaining)
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
      if (
        !AuthUtil.isHavePermission(
          PermissionsConstant.VIEW_PRODUCT,
          req.permissions ?? []
        )
      ) {
        throw new ForbiddenException("คุณไม่มีสิทธิ์เพิ่มดูสินค้า");
      }

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
}

export const productService = new ProductService();
