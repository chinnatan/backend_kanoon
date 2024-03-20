import { PoolClient } from "pg";
import { loggerUtil } from "../../util/logger.util";

export default class CategoryDAO {
  static async addCategory(
    client: PoolClient,
    storeId: number,
    createBy: number
  ) {
    let categoryId = -1;
    try {
      const queryAddCategory = {
        text: `insert into category (store_id, create_by) values ($1, $2) returning id`,
        values: [storeId, createBy],
      };

      const inserted = await client
        .query(queryAddCategory)
        .then((result) => {
          return result.rows;
        })
        .catch((error) => {
          throw new Error(error);
        });

      if (inserted.length > 0) {
        categoryId = inserted[0].id;
      }

      loggerUtil.info(`inserted order id ${categoryId}`);
    } catch (error) {
      throw error;
    }
    return categoryId;
  }

  static async addCategoryDetail(
    client: PoolClient,
    langId: number,
    name: string,
    categoryId: number,
    createBy: number
  ) {
    try {
      const queryAddCategoryDetail = {
        text: `insert into category_detail (lang_id, name, category_id, create_by) values ($1, $2, $3, $4)`,
        values: [langId, name, categoryId, createBy],
      };

      const inserted = await client
        .query(queryAddCategoryDetail)
        .then((result) => {
          return result.rowCount;
        })
        .catch((error) => {
          throw new Error(error);
        });


      loggerUtil.info(`inserted category detail ${inserted} row(s)`);
    } catch (error) {
      throw error;
    }
  }
}
