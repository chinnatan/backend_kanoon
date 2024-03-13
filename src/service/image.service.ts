import { Request, Response, NextFunction } from "express";
import { HandleService } from "../handle/handle";
import { MessageResponse } from "../model/service/message.rs..model";
import pool from "../util/db.util";
import { InvalidDataException } from "../exception/invaliddata.exception";
import { loggerUtil } from "../util/logger.util";
import { ImageTypeConstant } from "../constant/image_type.const";
import GoogleUtil from "../util/google.util";
import Jimp from "jimp";
import sharp from "sharp";

export class ImageService {
  async upload(req: Request, res: Response) {
    const h = new HandleService("upload", req, res);
    const client = await pool.connect();
    try {
      const imgType = req.file?.mimetype;
      if (
        ImageTypeConstant.PNG !== imgType &&
        ImageTypeConstant.JPG !== imgType &&
        ImageTypeConstant.JPEG !== imgType
      ) {
        throw new InvalidDataException("ไฟล์ไม่ถูกต้อง");
      }

      const imageStreamBuffer = req.file?.buffer;
      const streamLength = req.file?.buffer.length;

      let newBuffer;
      if (imageStreamBuffer != null) {
        newBuffer = await sharp(imageStreamBuffer)
          .resize({ height: 300 })
          .jpeg({
            quality: 100,
          })
          .toBuffer()
          .then((value) => {
            return value;
          });
      }

      const googlgeAuth = await GoogleUtil.authen();

      if (newBuffer != undefined) {
        const fileName = await GoogleUtil.uploadImage(
          googlgeAuth,
          imgType,
          newBuffer
        );

        h.handleSuccess(new MessageResponse(true, fileName));
      }
    } catch (err: any) {
      loggerUtil.error(err);
      h.handleError(err);
    } finally {
      client.release();
    }
  }

  async view(req: Request, res: Response) {
    const h = new HandleService("view", req, res);
    const client = await pool.connect();
    try {
      const { id } = req.params;

      const googlgeAuth = await GoogleUtil.authen();
      const imageBuffer = await GoogleUtil.getImage(googlgeAuth, id);

      h.handleSuccess(
        new MessageResponse(
          true,
          `data:image/jpg;base64,${Buffer.from(imageBuffer).toString("base64")}`
        )
      );
    } catch (err: any) {
      loggerUtil.error(err);
      h.handleError(err);
    } finally {
      client.release();
    }
  }

  async delete(req: Request, res: Response) {
    const h = new HandleService("delete", req, res);
    const client = await pool.connect();
    try {
      const { id } = req.params;

      const googlgeAuth = await GoogleUtil.authen();
      const deleted = await GoogleUtil.deleteImage(googlgeAuth, id);

      if (!deleted) {
        throw new InvalidDataException("ลบไม่สำเร็จ");
      }

      h.handleSuccess(new MessageResponse(true, "ลบสำเร็จ"));
    } catch (err: any) {
      loggerUtil.error(err);
      h.handleError(err);
    } finally {
      client.release();
    }
  }
}

export const imageService = new ImageService();
