import { PoolClient } from "pg";
import ProductStock from "../../model/product/product_stock.model"
import { loggerUtil } from "../../util/logger.util";

export default class ProductDAO {
  static async getAllStockByProductId(
    client: PoolClient,
    productId: number
  ): Promise<ProductStock[]> {
    let listProductStocks: ProductStock[] = [];
    try {
      const queryAllStock = {
        text: `select * from products_history 
                where product_id = $1
                    and qty_remaining != 0
                order by id asc`,
        values: [productId],
      };

      let raw = await client
        .query(queryAllStock)
        .then((result) => {
          return result.rows;
        })
        .catch((error) => {
          throw new Error(error);
        });

      if (raw.length > 0) {
        raw.forEach((x) => {
          listProductStocks.push(
            new ProductStock(x.id, x.product_id, x.qty, x.qty_remaining)
          );
        });
      }
    } catch (error) {
      throw error;
    }
    return listProductStocks;
  }

  static async updateProductStock(
    client: PoolClient,
    stockId: number,
    updateBy: number,
    cutStock: number
  ) {
    try {
      const queryCutStock = {
        text: `update products_history 
                set qty_remaining = $1,
                    update_at = CURRENT_TIMESTAMP, update_by = $2
                where id = $3`,
        values: [cutStock, updateBy, stockId],
      };
      const updated = await client
        .query(queryCutStock)
        .then((result) => {
          return result.rowCount;
        })
        .catch((error) => {
          throw new Error(error);
        });
      loggerUtil.info(`updated product stock id ${stockId} => ${updated} rows`);
    } catch (error) {
      throw error;
    }
  }
}
