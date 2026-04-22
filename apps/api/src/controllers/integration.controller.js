import mongoose from "mongoose";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { Integration, toPublicIntegration } from "../models/Integration.js";
import {
  buildGithubAuthorizeUrl,
  exchangeCodeForToken,
  fetchGithubUserProfile,
  isGithubOAuthConfigured,
  verifyGithubOauthState,
} from "../services/githubOAuth.service.js";
import { env } from "../config/env.js";
import { ingestGithubEventsForUser } from "../services/githubIngest.service.js";
import { encryptString } from "../utils/fieldCrypto.js";
import {
  buildSlackAuthorizeUrl,
  exchangeSlackCodeForToken,
  isSlackOAuthConfigured,
  verifySlackOauthState,
} from "../services/slackOAuth.service.js";

export const list = asyncHandler(async (req, res) => {
  const docs = await Integration.find({ userId: req.userId });
  res.json({
    integrations: docs.map((d) => toPublicIntegration(d)),
  });
});

/**
 * @returns {string} url for browser navigation
 */
export const githubAuthorizeUrl = asyncHandler(async (req, res) => {
  if (!isGithubOAuthConfigured()) {
    throw new AppError(
      503,
      "GITHUB_NOT_CONFIGURED",
      "Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in apps/api/.env (see .env.example)."
    );
  }
  const url = buildGithubAuthorizeUrl(String(req.userId));
  res.json({ url });
});

export const githubCallback = asyncHandler(async (req, res) => {
  const base = String(env.WEB_ORIGIN).replace(/\/$/, "");
  if (req.query.error) {
    return res.redirect(
      `${base}/settings?github_error=${encodeURIComponent(String(req.query.error))}`
    );
  }
  const code = req.query.code;
  const state = req.query.state;
  if (!code || !state) {
    return res.redirect(`${base}/settings?github_error=missing_params`);
  }
  if (!isGithubOAuthConfigured()) {
    return res.redirect(`${base}/settings?github_error=not_configured`);
  }
  let userId;
  try {
    userId = verifyGithubOauthState(String(state));
  } catch {
    return res.redirect(`${base}/settings?github_error=invalid_state`);
  }
  const { accessToken, scope } = await exchangeCodeForToken(String(code));
  const gh = await fetchGithubUserProfile(accessToken);
  const enc = encryptString(accessToken);
  await Integration.findOneAndUpdate(
    { userId: new mongoose.Types.ObjectId(userId), platform: "github" },
    {
      $set: {
        encryptedAccessToken: enc,
        tokenExpiresAt: null,
        metadata: {
          githubLogin: gh.login,
          githubUserId: gh.id,
          avatarUrl: gh.avatarUrl,
          scope,
        },
      },
    },
    { upsert: true, new: true }
  );
  return res.redirect(`${base}/settings?github=connected`);
});

export const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(422, "VALIDATION_ERROR", "Invalid integration id");
  }
  const doc = await Integration.findOneAndDelete({
    _id: id,
    userId: req.userId,
  });
  if (!doc) {
    throw new AppError(404, "NOT_FOUND", "Integration not found");
  }
  res.json({ ok: true });
});

export const syncGithub = asyncHandler(async (req, res) => {
  if (!isGithubOAuthConfigured()) {
    throw new AppError(
      503,
      "GITHUB_NOT_CONFIGURED",
      "GitHub OAuth is not configured on the server."
    );
  }
  const int = await Integration.findOne({
    userId: req.userId,
    platform: "github",
  }).select("+encryptedAccessToken");
  if (!int) {
    throw new AppError(404, "NOT_FOUND", "GitHub is not connected");
  }
  const { created } = await ingestGithubEventsForUser(int);
  res.json({ ok: true, created });
});

export const slackAuthorizeUrl = asyncHandler(async (req, res) => {
  if (!isSlackOAuthConfigured()) {
    throw new AppError(
      503,
      "SLACK_NOT_CONFIGURED",
      "Set SLACK_CLIENT_ID and SLACK_CLIENT_SECRET in apps/api/.env (see .env.example)."
    );
  }
  const url = buildSlackAuthorizeUrl(String(req.userId));
  res.json({ url });
});

export const slackCallback = asyncHandler(async (req, res) => {
  const base = String(env.WEB_ORIGIN).replace(/\/$/, "");
  if (req.query.error) {
    return res.redirect(
      `${base}/settings?slack_error=${encodeURIComponent(String(req.query.error))}`
    );
  }
  const code = req.query.code;
  const state = req.query.state;
  if (!code || !state) {
    return res.redirect(`${base}/settings?slack_error=missing_params`);
  }
  if (!isSlackOAuthConfigured()) {
    return res.redirect(`${base}/settings?slack_error=not_configured`);
  }
  let userId;
  try {
    userId = verifySlackOauthState(String(state));
  } catch {
    return res.redirect(`${base}/settings?slack_error=invalid_state`);
  }
  const ex = await exchangeSlackCodeForToken(String(code));
  const enc = encryptString(ex.accessToken);
  await Integration.findOneAndUpdate(
    { userId: new mongoose.Types.ObjectId(userId), platform: "slack" },
    {
      $set: {
        encryptedAccessToken: enc,
        tokenExpiresAt: null,
        metadata: {
          teamId: ex.team.id,
          teamName: ex.team.name,
          slackUserId: ex.authedUserId,
          slackUserName: ex.userName,
        },
      },
    },
    { upsert: true, new: true }
  );
  return res.redirect(`${base}/settings?slack=connected`);
});
