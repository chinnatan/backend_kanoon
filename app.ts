import dotenv from "dotenv";
import express, { Express } from "express";
import cors, { CorsOptions } from "cors";
import { loggerUtil } from "./src/util/logger.util";
import i18NextMiddleware from "i18next-http-middleware";
import i18next from "i18next";
import I18NexFsBackend from "i18next-fs-backend";

dotenv.config();

// Setup i18n
i18next
  .use(I18NexFsBackend)
  .use(i18NextMiddleware.LanguageDetector)
  .init({
    backend: {
      loadPath: __dirname + "/src/locales/{{lng}}/{{ns}}.json",
    },
    fallbackLng: "th",
    preload: ["en", "th"],
  });

const app: Express = express();
const port = process.env.PORT;

const origin =
  process.env.NODE_ENV === "development"
    ? ["http://localhost:8080"]
    : [""];
const corsConfig: CorsOptions = {
  origin: origin,
  credentials: true,
};

app.use(cors(corsConfig));
app.use(i18NextMiddleware.handle(i18next));

import { router as authController } from "./src/controller/auth.controller";
app.use("/rest/auth", authController);

import { router as categoryController } from "./src/controller/category.controller";
app.use("/rest/category", categoryController);

import { router as productController } from "./src/controller/product.controller";
app.use("/rest/product", productController);

import { router as orderController } from "./src/controller/order.controller";
app.use("/rest/order", orderController);

import { router as imageController } from "./src/controller/image.controller";
app.use("/rest/image", imageController);

app.listen(port, () => {
  loggerUtil.info(`⚡️ [server]: Server is running at https://localhost:${port}`);
});
