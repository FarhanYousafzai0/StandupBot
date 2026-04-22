import crypto from "crypto";
import { env } from "../config/env.js";

function key() {
  return crypto.createHash("sha256").update(env.JWT_SECRET, "utf8").digest();
}

/**
 * @param {string} plain
 * @returns {string} base64url blob (iv + tag + ciphertext)
 */
export function encryptString(plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64url");
}

/**
 * @param {string} stored
 * @returns {string}
 */
export function decryptString(stored) {
  const buf = Buffer.from(stored, "base64url");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const text = buf.subarray(28);
  const dec = crypto.createDecipheriv("aes-256-gcm", key(), iv);
  dec.setAuthTag(tag);
  return dec.update(text, undefined, "utf8") + dec.final("utf8");
}
