import { PoolClient } from "pg";
import ProductStock from "../../model/product/product_stock.model";
import { loggerUtil } from "../../util/logger.util";
import Product from "../../model/product/product.model";
import ProductDAO from "./product.dao";

export default class PurchaseDAO {
  static async addPurchase(
    client: PoolClient,
    createBy: number
  ): Promise<number> {
    let purchaseId: number = -1;
    try {
      const queryInsertPurchase = {
        text: `insert into purchases (create_by) values ($1) returning id`,
        values: [createBy],
      };

      const inserted = await client
        .query(queryInsertPurchase)
        .then((result) => {
          return result.rows;
        })
        .catch((error) => {
          throw new Error(error);
        });

      if (inserted.length > 0) {
        purchaseId = inserted[0].id;
      }

      loggerUtil.info(`inserted purchase id ${purchaseId}`);
    } catch (error) {
      throw error;
    }
    return purchaseId;
  }

  static async addPurchaseHistory(
    client: PoolClient,
    purchaseId: number,
    productId: number,
    productQTY: number
  ) {
    try {
      const product = await ProductDAO.getProductInfo(client, productId);

      const queryInsertHistory = {
        text: `insert into purchases_products (purchase_id, product_id, qty_total, price_total)
                values ($1, $2, $3, $4)`,
        values: [purchaseId, productId, productQTY, productQTY * (product?.price ?? 0)],
      };
      const inserted = await client
        .query(queryInsertHistory)
        .then((result) => {
          return result.rowCount;
        })
        .catch((error) => {
          throw new Error(error);
        });
      loggerUtil.info(`inserted purchase history ${inserted} rows`);
    } catch (error) {
      throw error;
    }
  }
}
