import { Router } from "express";
import bodyParser from "body-parser";
import { categoryService } from "../service/category.service";
import { middleware } from "../middleware/middleware";

export const router = Router();

// parse application/json
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

router.post("/add", middleware, categoryService.addCategory);
// router.post("/:product_id/stock/add", middleware, categoryService.addProductStock);

// router.get("/store/:id", middleware, categoryService.getProducts);
// router.get("/store/:id/total", middleware, categoryService.getProductsTotal);
