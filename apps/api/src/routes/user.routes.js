import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import * as userController from "../controllers/user.controller.js";

const router = Router();

router.get("/me", requireAuth, userController.getMe);

export default router;
