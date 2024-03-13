import { Router } from "express";
import bodyParser from "body-parser";
import { imageService } from "../service/image.service";
import { middleware } from "../middleware/middleware";
import multer from "multer";
const inMemoryStorage = multer.memoryStorage();
const uploadStrategy = multer({ storage: inMemoryStorage }).single('file');

export const router = Router();

// parse application/json
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

router.post("/upload", middleware, uploadStrategy, imageService.upload);
router.get("/:id/view", middleware, imageService.view);
router.put("/:id/delete", middleware, imageService.delete);
