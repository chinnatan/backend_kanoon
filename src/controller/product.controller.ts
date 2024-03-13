import { Router } from "express";
import bodyParser from "body-parser";
import { productService } from "../service/product.service";
import { middleware } from "../middleware/middleware";

export const router = Router();

// parse application/json
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

router.post("/add", middleware, productService.addProduct);
router.post("/:product_id/stock/add", middleware, productService.addProductStock);
router.post("/purchase", middleware, productService.purchase);

router.get("/store/:id", middleware, productService.getProducts);
router.get("/store/:id/total", middleware, productService.getProductsTotal);
