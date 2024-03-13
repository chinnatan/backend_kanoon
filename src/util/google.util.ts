import { google } from "googleapis";
import stream from "stream";
import { loggerUtil } from "./logger.util";

const pkey = require("../../kanoon-google-service.json");
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

export default class GoogleUtil {
  static async authen() {
    const jwtClient = new google.auth.JWT(
      pkey.client_email,
      undefined,
      pkey.private_key,
      SCOPES
    );
    await jwtClient.authorize();
    return jwtClient;
  }

  static drive(auth: any) {
    return google.drive({ version: "v3", auth: auth });
  }

  static async uploadImage(auth: any, imgType: string, imageFile: Buffer) {
    const file = await GoogleUtil.drive(auth).files.create({
      media: {
        mimeType: imgType,
        body: new stream.PassThrough().end(imageFile),
      },
      fields: "id,name",
      requestBody: {
        name: `product-image-${new Date().getTime()}`,
        mimeType: imgType,
        parents: ["1UuH0VNDyy0LcSPnYgj3Y9FlBicp5CvB8"],
      },
    });
    return file.data.id;
  }

  static async getImage(auth: any, fileId: string) {
    const file = await GoogleUtil.drive(auth).files.get(
      {
        fileId: fileId,
        alt: "media",
        auth: auth,
      },
      { responseType: "stream" }
    );

    let imageBuffer: any = await new Promise<void>((resolve, reject) => {
      let buf: any = [];
      file.data.on("data", (chunk) => {
        buf.push(chunk);
      });
      file.data.on("error", (err) => {
        reject(`Cannot create file ${err}`);
      });
      file.data.on("end", () => {
        const buffer: any = Buffer.concat(buf);
        resolve(buffer);
      });
    });
    return imageBuffer;
  }

  static async deleteImage(auth: any, fileId: string) {
    const file = await GoogleUtil.drive(auth).files.delete({
      fileId: fileId,
    });
    if (file.status === 204) {
      return true;
    }
    return false;
  }
}
