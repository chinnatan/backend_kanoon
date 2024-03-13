import { Router } from "express";
import bodyParser from "body-parser";
import { authService } from "../service/auth.service";
import { refreshTokenValidate } from "../middleware/middleware";

export const router = Router();

// parse application/json
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

router.post("/login", authService.login);
router.post("/refresh", refreshTokenValidate, authService.refreshToken);
