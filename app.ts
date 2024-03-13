import bodyParser from "body-parser";
import dotenv from "dotenv";
import express, { Express } from "express";
import cors, { CorsOptions } from "cors";
import { loggerUtil } from "./src/util/logger.util";

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());

const origin =
  process.env.NODE_ENV === "development"
    ? ["http://localhost:8080"]
    : [""];
const corsConfig: CorsOptions = {
  origin: origin,
  credentials: true,
};

app.use(cors(corsConfig));

import { router as authController } from "./src/controller/auth.controller";
app.use("/rest/auth", authController);

import { router as productController } from "./src/controller/product.controller";
app.use("/rest/product", productController);

import { router as purchaseController } from "./src/controller/purchase.controller";
app.use("/rest/purchase", purchaseController);

import { router as imageController } from "./src/controller/image.controller";
app.use("/rest/image", imageController);

app.listen(port, () => {
  loggerUtil.info(`⚡️ [server]: Server is running at https://localhost:${port}`);
});
