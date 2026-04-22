import jwt from "jsonwebtoken";
import { WebClient } from "@slack/web-api";
import { env } from "../config/env.js";

export function isSlackOAuthConfigured() {
  return Boolean(
    String(env.SLACK_CLIENT_ID).trim() && String(env.SLACK_CLIENT_SECRET).trim()
  );
}

function callbackUrl() {
  return `${String(env.API_PUBLIC_URL).replace(/\/$/, "")}/api/integrations/slack/callback`;
}

/** Scopes: bot posts to channels and DMs. Documented in README. */
const SLACK_BOT_SCOPES = ["chat:write", "im:write", "users:read"].join(",");

/**
 * @param {string} userId
 * @returns {string}
 */
export function buildSlackAuthorizeUrl(userId) {
  if (!isSlackOAuthConfigured()) {
    throw new Error("Slack OAuth is not configured");
  }
  const state = jwt.sign(
    { sub: userId, p: "sl" },
    env.JWT_SECRET,
    { expiresIn: "10m" }
  );
  const params = new URLSearchParams({
    client_id: String(env.SLACK_CLIENT_ID).trim(),
    redirect_uri: callbackUrl(),
    state,
    scope: SLACK_BOT_SCOPES,
  });
  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}

/**
 * @param {string} state
 * @returns {string} userId
 */
export function verifySlackOauthState(state) {
  const p = jwt.verify(state, env.JWT_SECRET);
  if (p.p !== "sl" || typeof p.sub !== "string") {
    throw new Error("Invalid OAuth state");
  }
  return p.sub;
}

/**
 * @param {string} code
 * @returns {Promise<{ accessToken: string, team: object, authedUserId: string, userName: string }>}
 */
export async function exchangeSlackCodeForToken(code) {
  const body = new URLSearchParams();
  body.set("client_id", String(env.SLACK_CLIENT_ID).trim());
  body.set("client_secret", String(env.SLACK_CLIENT_SECRET).trim());
  body.set("code", code);
  body.set("redirect_uri", callbackUrl());

  const res = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    body,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(data.error || "Slack token exchange failed");
  }
  const accessToken = data.access_token;
  if (typeof accessToken !== "string") {
    throw new Error("No Slack access token");
  }
  const authed = data.authed_user || {};
  const authedUserId = authed.id || "";
  const team = data.team || data.enterprise || { id: "", name: "" };
  const client = new WebClient(accessToken);
  let userName = authedUserId;
  if (authedUserId) {
    try {
      const ui = await client.users.info({ user: authedUserId });
      if (ui.ok && ui.user) {
        userName =
          ui.user.real_name ||
          ui.user.name ||
          ui.user.profile?.display_name ||
          authedUserId;
      }
    } catch {
      // ignore; keep id as label
    }
  }
  return {
    accessToken,
    team: { id: team.id || "", name: team.name || "" },
    authedUserId: String(authedUserId),
    userName: String(userName),
  };
}

export { callbackUrl as getSlackCallbackUrl };
