import i18next from "i18next";
import { Request } from "express";

export class AddCategoryException extends Error {
  message: string = i18next.t("EXCEPTION.NOT_PERMISSION.ADD_CATEGORY");
  status: number = 403;

  constructor(req: Request) {
    super();
    this.message = req.t("EXCEPTION.NOT_PERMISSION.ADD_CATEGORY");
  }
}
