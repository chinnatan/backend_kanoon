import { PoolClient } from "pg";
import ProductStock from "../../model/product/product_stock.model";
import { loggerUtil } from "../../util/logger.util";
import Product from "../../model/product/product.model";
import ProductDAO from "./product.dao";
import { DataNotFoundException } from "../../exception/datanotfound.exception";
import PurchaseHistory from "../../model/purchase/purchase_history.model";

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
        values: [
          purchaseId,
          productId,
          productQTY,
          productQTY * (product?.price ?? 0),
        ],
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

  static async getPurchaseHistoryById(client: PoolClient, purchaseId: number) {
    let listHistory: PurchaseHistory[] = [];
    try {
      const queryGetPurchaseHistory = {
        text: `select p.id as purchase_id,
                    pp.product_id,
                    pp.qty_total 
                from purchases p 
                inner join purchases_products pp on pp.purchase_id = p.id
                where p.id = $1`,
        values: [purchaseId],
      };
      const rawPurchaseHistory = await client
        .query(queryGetPurchaseHistory)
        .then((result) => {
          return result.rows;
        })
        .catch((error) => {
          throw new Error(error);
        });

      loggerUtil.info(
        `purchase ${purchaseId} have product ${rawPurchaseHistory.length} row(s)`
      );

      if (rawPurchaseHistory.length > 0) {
        rawPurchaseHistory.forEach((item) => {
          listHistory.push(
            new PurchaseHistory(
              item.purchase_id,
              item.product_id,
              item.qty_total
            )
          );
        });
      }
    } catch (error) {
      throw error;
    }
    return listHistory;
  }

  static async cancelPurchase(client: PoolClient, purchaseId: number) {
    try {
      const queryDeletePurchase = {
        text: `delete from purchases where id = $1`,
        values: [purchaseId],
      };

      const deleted = await client
        .query(queryDeletePurchase)
        .then((result) => {
          return result.rowCount;
        })
        .catch((error) => {
          throw new Error(error);
        });

      loggerUtil.info(`cancel purchase id ${purchaseId}`);
      return deleted
    } catch (error) {
      throw error;
    }
  }
}
