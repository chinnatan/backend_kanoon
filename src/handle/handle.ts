import { Request, Response } from "express";
import { MessageResponse } from "../model/service/message.rs..model";
import { loggerUtil } from "../util/logger.util";
import { DataNotFoundException } from "../exception/datanotfound.exception";
import { InvalidDataException } from "../exception/invaliddata.exception";
import { ForbiddenException } from "../exception/forbidden.exception";
import { UnauthorizeException } from "../exception/unauthorize.exception";

export class HandleService {
  method: string;
  req: Request;
  res: Response;

  constructor(method: string, req: Request, res: Response) {
    this.method = method;
    this.req = req;
    this.res = res;
  }

  handleError(err: Error) {
    let userId = this.req.user?.id;
    let username = this.req.user?.username;
    let result: MessageResponse = new MessageResponse(false, "");
    let status: number = 500;

    if (err instanceof DataNotFoundException) {
      result = new MessageResponse(false);
      result.message = err.message;
      status = err.status;
    } else if (err instanceof InvalidDataException) {
      result = new MessageResponse(false);
      result.message = err.message;
      status = err.status;
    } else if (err instanceof ForbiddenException) {
      result = new MessageResponse(false);
      result.message = err.message;
      status = err.status;
    } else if (err instanceof UnauthorizeException) {
      result = new MessageResponse(false);
      result.message = err.message;
      status = err.status;
    } else {
      result.message = null;
      status = 500;
    }

    const messageLog = `username:${username} | userID:${userId} | API:${this.method} | HTTP:${this.req.method} | path:${this.req.originalUrl} | status:${status} | message:${result.message}`;
    this.consoleLog("error", messageLog);
    this.res.status(status);
    this.res.json(result);
    this.res.end();
  }

  handleSuccess(result: MessageResponse) {
    let userId = this.req.user?.id;
    let username = this.req.user?.username;
    result.message = "สำเร็จ";

    const messageLog = `username:${username} | userID:${userId} | API:${
      this.method
    } | HTTP:${this.req.method} | path:${
      this.req.originalUrl
    } | status:200 | message:${JSON.stringify(result.result)}`;

    this.consoleLog("success", messageLog);

    this.res.status(200);
    this.res.json(result);
    this.res.end();
  }

  consoleLog(event: string, message: string) {
    switch (event) {
      case "success":
        loggerUtil.info(message);
        break;
      case "error":
        loggerUtil.error(message);
        break;
    }
  }
}
