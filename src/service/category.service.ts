import { Request, Response } from "express";
import { HandleService } from "../handle/handle";
import { MessageResponse } from "../model/service/message.rs..model";
import pool from "../util/db.util";
import { InvalidDataException } from "../exception/invaliddata.exception";
import { loggerUtil } from "../util/logger.util";
import { PermissionsConstant } from "../constant/permissions.const";
import AuthUtil from "../util/auth.util";
import { DBConsant } from "../constant/db.const";
import CategoryDAO from "./dao/category.dao";
import { LangConst } from "../constant/lang.const";
import { AddCategoryException } from "../exception/permission/addcategory.exception";

export class CategoryService {
  async addCategory(req: Request, res: Response) {
    const h = new HandleService("addCategory", req, res);
    const client = await pool.connect();
    try {
      if (
        !AuthUtil.isHavePermission(
          PermissionsConstant.ADD_CATEOGRY,
          req.permissions ?? []
        )
      ) {
        throw new AddCategoryException(req);
      }

      await client.query(DBConsant.BEGIN);

      const { category_name_th, cateogry_name_en } = req.body;
      if (!category_name_th || !cateogry_name_en) {
        throw new InvalidDataException(req.t("EXCEPTION.REQUIRE_DATA"));
      }

      let categoryId = await CategoryDAO.addCategory(
        client,
        req.user?.storeId ?? 0,
        req.user?.id ?? 0
      );

      if (categoryId === -1) {
        throw new InvalidDataException(req.t("EXCEPTION.FAIL_SAVE_DATA"));
      }

      if (category_name_th) {
        await CategoryDAO.addCategoryDetail(
          client,
          LangConst.TH,
          category_name_th,
          categoryId,
          req.user?.id ?? 0
        );
      }

      if (cateogry_name_en) {
        await CategoryDAO.addCategoryDetail(
          client,
          LangConst.EN,
          cateogry_name_en,
          categoryId,
          req.user?.id ?? 0
        );
      }

      await client.query(DBConsant.COMMIT);

      h.handleSuccess(
        new MessageResponse({
          success: true,
          result: req.t("SUCCESS.ADD_CATEGORY_SUCCESS"),
        })
      );
    } catch (err: any) {
      await client.query(DBConsant.ROLLBACK);
      loggerUtil.error(err);
      h.handleError(err);
    } finally {
      client.release();
    }
  }
}

export const categoryService = new CategoryService();
