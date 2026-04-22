import { Router } from "express";
import { isDbConnected } from "../config/db.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    if (!isDbConnected()) {
      return res.status(503).json({
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Database not connected",
        },
      });
    }
    res.json({ status: "ok", database: "connected" });
  })
);

export default router;
