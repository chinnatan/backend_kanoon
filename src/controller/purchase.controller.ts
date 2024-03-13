import { Router } from "express";
import bodyParser from "body-parser";
import { purchaseService } from "../service/purchase.service";
import { middleware } from "../middleware/middleware";

export const router = Router();

// parse application/json
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

router.post("/", middleware, purchaseService.purchase);

router.put("/:purchase_id/cancel", middleware, purchaseService.cancelPurchase);
