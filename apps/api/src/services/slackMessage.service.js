import { WebClient } from "@slack/web-api";
import { env } from "../config/env.js";

const MAX = 38_000;

/**
 * @param {object} p
 * @param {string} p.token
 * @param {string} p.slackUserId
 * @param {string} p.text
 */
export async function postToUserDirectMessage({ token, slackUserId, text }) {
  const client = new WebClient(token);
  const t = String(text).slice(0, MAX);
  const open = await client.conversations.open({ users: slackUserId });
  if (!open.ok || !open.channel) {
    throw new Error(open.error || "Could not open Slack DM");
  }
  const ch = open.channel;
  return client.chat.postMessage({
    channel: ch.id,
    text: t,
    mrkdwn: true,
  });
}

/**
 * @param {object} p
 * @param {string} p.token
 * @param {string} p.channel
 * @param {string} p.text
 */
export async function postToChannel({ token, channel, text }) {
  const client = new WebClient(token);
  const t = String(text).slice(0, MAX);
  return client.chat.postMessage({
    channel,
    text: t,
    mrkdwn: true,
  });
}

/**
 * Optional ping after auto-draft (link back to the web app).
 * @param {object} p
 * @param {string} p.token
 * @param {string} p.slackUserId
 * @param {string} p.dateYmd
 */
export async function postDraftReadyPing({ token, slackUserId, dateYmd }) {
  const base = String(env.WEB_ORIGIN).replace(/\/$/, "");
  return postToUserDirectMessage({
    token,
    slackUserId,
    text: `Your standup draft for *${dateYmd}* is ready. Open <${base}/standup|StandupBot> to review and send.`,
  });
}
