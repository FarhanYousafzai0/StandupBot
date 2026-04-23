import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import * as c from "../controllers/integration.controller.js";
import { oauthRateLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.get(
  "/github/callback",
  oauthRateLimiter,
  c.githubCallback
);
router.get(
  "/slack/callback",
  oauthRateLimiter,
  c.slackCallback
);
router.get("/github/authorize", oauthRateLimiter, requireAuth, c.githubAuthorizeUrl);
router.get("/slack/authorize", oauthRateLimiter, requireAuth, c.slackAuthorizeUrl);
router.get("/", requireAuth, c.list);
router.delete("/:id", requireAuth, c.remove);
router.post("/github/sync", requireAuth, c.syncGithub);

export default router;
