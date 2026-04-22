import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import * as activityController from "../controllers/activity.controller.js";

const router = Router();
router.use(requireAuth);

router.get("/today", activityController.listToday);
router.get("/", activityController.list);
router.post("/", activityController.create);
router.delete("/:id", activityController.remove);

export default router;
