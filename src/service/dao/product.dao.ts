import { PoolClient } from "pg";
import ProductStock from "../../model/product/product_stock.model";
import { loggerUtil } from "../../util/logger.util";
import Product from "../../model/product/product.model";

export default class ProductDAO {
  static async getProductInfo(
    client: PoolClient,
    productId: number
  ): Promise<Product | null> {
    let product: Product | null = null;
    try {
      const queryGetProducts = {
        text: `select p.id, p.product_name, p.product_desc, p.product_image, p.product_price
                from products p 
                where p.id = $1`,
        values: [productId],
      };

      let raw = await client
        .query(queryGetProducts)
        .then((result) => {
          return result.rows;
        })
        .catch((error) => {
          throw new Error(error);
        });

      if (raw.length > 0) {
        product = new Product(
          raw[0].id,
          raw[0].product_name,
          raw[0].product_desc,
          raw[0].product_image,
          raw[0].product_price
        );
      }
    } catch (error) {
      throw error;
    }
    return product;
  }

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

  static async addProductStock(client: PoolClient, productId: number, qty:number, userId:number) {
    try {
      const queryaddProductStock = {
        text: `insert into products_history (product_id, qty, qty_remaining, create_by) values ($1, $2, $3, $4)`,
        values: [productId, qty, qty, userId],
      };

      const inserted = await client
        .query(queryaddProductStock)
        .then((result) => {
          return result.rowCount;
        });

      loggerUtil.info(`inserted product stock ${inserted} row`);
    } catch (error) {
      throw error;
    }
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
