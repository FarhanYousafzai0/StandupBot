import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { authRateLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.post("/register", authRateLimiter, authController.register);
router.post("/login", authRateLimiter, authController.login);

export default router;
