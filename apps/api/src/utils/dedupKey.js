import crypto from "crypto";
import { dayKeyForInstant } from "./dayRange.js";

/**
 * Idempotency: same `userId + source + url + day` in user TZ, matching the plan. When `url` is
 * empty, `title` is included so several manual lines per day are still allowed.
 * @param {string} userId
 * @param {string} source
 * @param {string} url
 * @param {string} title
 * @param {Date} timestamp
 * @param {string} timeZone
 * @returns {string} hex sha256
 */
export function makeActivityDedupKey(
  userId,
  source,
  url,
  title,
  timestamp,
  timeZone
) {
  const day = dayKeyForInstant(timestamp, timeZone);
  const key =
    url && String(url).length > 0
      ? String(url)
      : `t:${String(title).slice(0, 500)}`;
  const raw = [userId, source, key, day].join("\0");
  return crypto.createHash("sha256").update(raw).digest("hex");
}
