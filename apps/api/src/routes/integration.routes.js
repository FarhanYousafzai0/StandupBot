import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import * as c from "../controllers/integration.controller.js";

const router = Router();

router.get(
  "/github/callback",
  c.githubCallback
);
router.get(
  "/slack/callback",
  c.slackCallback
);
router.get("/github/authorize", requireAuth, c.githubAuthorizeUrl);
router.get("/slack/authorize", requireAuth, c.slackAuthorizeUrl);
router.get("/", requireAuth, c.list);
router.delete("/:id", requireAuth, c.remove);
router.post("/github/sync", requireAuth, c.syncGithub);

export default router;
