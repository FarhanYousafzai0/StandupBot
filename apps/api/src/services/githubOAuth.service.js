import jwt from "jsonwebtoken";
import { Octokit } from "@octokit/rest";
import { env } from "../config/env.js";

export function isGithubOAuthConfigured() {
  return Boolean(
    String(env.GITHUB_CLIENT_ID).trim() &&
      String(env.GITHUB_CLIENT_SECRET).trim()
  );
}

function callbackUrl() {
  return `${String(env.API_PUBLIC_URL).replace(/\/$/, "")}/api/integrations/github/callback`;
}

/**
 * @param {string} userId
 * @returns {string} Full GitHub authorize URL
 */
export function buildGithubAuthorizeUrl(userId) {
  if (!isGithubOAuthConfigured()) {
    throw new Error("GitHub OAuth is not configured");
  }
  const state = jwt.sign(
    { sub: userId, p: "gh" },
    env.JWT_SECRET,
    { expiresIn: "10m" }
  );
  const params = new URLSearchParams({
    client_id: String(env.GITHUB_CLIENT_ID).trim(),
    redirect_uri: callbackUrl(),
    scope: "read:user repo",
    state,
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

/**
 * @param {string} state
 * @returns {string} userId
 */
export function verifyGithubOauthState(state) {
  const p = jwt.verify(state, env.JWT_SECRET);
  if (p.p !== "gh" || typeof p.sub !== "string") {
    throw new Error("Invalid OAuth state");
  }
  return p.sub;
}

/**
 * @param {string} code
 * @returns {Promise<{ accessToken: string, scope: string }>}
 */
export async function exchangeCodeForToken(code) {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: String(env.GITHUB_CLIENT_ID).trim(),
      client_secret: String(env.GITHUB_CLIENT_SECRET).trim(),
      code,
      redirect_uri: callbackUrl(),
    }),
  });
  const data = await res.json();
  if (data.error) {
    throw new Error(
      data.error_description || data.error || "Token exchange failed"
    );
  }
  if (typeof data.access_token !== "string") {
    throw new Error("No access token from GitHub");
  }
  return {
    accessToken: data.access_token,
    scope: String(data.scope || ""),
  };
}

/**
 * @param {string} accessToken
 */
export async function fetchGithubUserProfile(accessToken) {
  const octokit = new Octokit({ auth: accessToken });
  const { data } = await octokit.rest.users.getAuthenticated();
  return {
    login: data.login,
    id: data.id,
    avatarUrl: data.avatar_url,
  };
}

export { callbackUrl as getGithubCallbackUrl };
