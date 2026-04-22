import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import * as standupController from "../controllers/standup.controller.js";

const router = Router();
router.use(requireAuth);

router.get("/today", standupController.getToday);
router.post("/generate", standupController.generate);
router.put("/:id", standupController.update);

export default router;
