import { z } from "zod";
import mongoose from "mongoose";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { User } from "../models/User.js";
import { Activity, toPublicActivity } from "../models/Activity.js";
import {
  getTodayYmdInZone,
  getUtcRangeForUserDay,
} from "../utils/dayRange.js";
import { makeActivityDedupKey } from "../utils/dedupKey.js";

const createBodySchema = z.object({
  source: z.enum(["github", "jira", "vscode", "slack", "manual"]),
  type: z.string().min(1).max(120),
  title: z.string().min(1).max(500),
  description: z.string().max(20000).optional().default(""),
  url: z.union([z.string().url().max(2000), z.literal("")]).optional().default(""),
  metadata: z.record(z.unknown()).optional().default({}),
  /** ISO-8601 optional; default now on server */
  timestamp: z.string().optional(),
  isBlocker: z.boolean().optional().default(false),
});

async function loadUserOr404(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, "NOT_FOUND", "User not found");
  }
  return user;
}

/**
 * @param {string} userId
 * @param {string} timeZone
 * @param {string} ymd
 */
async function findForDay(userId, timeZone, ymd) {
  const { start, end } = getUtcRangeForUserDay(ymd, timeZone);
  const items = await Activity.find({
    userId,
    timestamp: { $gte: start, $lte: end },
  })
    .sort({ timestamp: -1 })
    .lean();
  return { items };
}

function validateYmdInZone(ymd, timeZone) {
  try {
    getUtcRangeForUserDay(ymd, timeZone);
    return true;
  } catch {
    return false;
  }
}

export const listToday = asyncHandler(async (req, res) => {
  const user = await loadUserOr404(req.userId);
  const ymd = getTodayYmdInZone(user.timezone);
  const { items } = await findForDay(req.userId, user.timezone, ymd);
  res.json({
    date: ymd,
    timezone: user.timezone,
    activities: items.map((a) => toPublicActivity(a)),
  });
});

export const list = asyncHandler(async (req, res) => {
  const user = await loadUserOr404(req.userId);
  let ymd;
  if (req.query.date != null && String(req.query.date).length > 0) {
    const s = String(req.query.date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      throw new AppError(422, "VALIDATION_ERROR", "date must be YYYY-MM-DD");
    }
    ymd = s;
  } else {
    ymd = getTodayYmdInZone(user.timezone);
  }
  if (!validateYmdInZone(ymd, user.timezone)) {
    throw new AppError(422, "VALIDATION_ERROR", "Invalid date for your timezone");
  }
  const { items } = await findForDay(req.userId, user.timezone, ymd);
  res.json({
    date: ymd,
    timezone: user.timezone,
    activities: items.map((a) => toPublicActivity(a)),
  });
});

export const create = asyncHandler(async (req, res) => {
  const parsed = createBodySchema.safeParse(req.body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new AppError(422, "VALIDATION_ERROR", first?.message || "Invalid body");
  }
  const user = await loadUserOr404(req.userId);
  const body = parsed.data;
  let timestamp = new Date();
  if (body.timestamp && body.timestamp.length > 0) {
    const t = new Date(body.timestamp);
    if (Number.isNaN(t.getTime())) {
      throw new AppError(422, "VALIDATION_ERROR", "timestamp must be a valid ISO-8601 date");
    }
    timestamp = t;
  }

  const dedupKey = makeActivityDedupKey(
    req.userId,
    body.source,
    body.url || "",
    body.title,
    timestamp,
    user.timezone
  );

  try {
    const doc = await Activity.create({
      userId: req.userId,
      source: body.source,
      type: body.type,
      title: body.title,
      description: body.description,
      url: body.url,
      metadata: body.metadata,
      timestamp,
      isBlocker: body.isBlocker,
      dedupKey,
    });
    res.status(201).json({ activity: toPublicActivity(doc) });
  } catch (err) {
    if (err && (err.code === 11000 || err.code === "11000")) {
      throw new AppError(
        409,
        "DUPLICATE_ACTIVITY",
        "The same activity is already recorded for that day (deduplicated by source and URL)"
      );
    }
    throw err;
  }
});

export const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(422, "VALIDATION_ERROR", "Invalid activity id");
  }
  const doc = await Activity.findOneAndDelete({ _id: id, userId: req.userId });
  if (!doc) {
    throw new AppError(404, "NOT_FOUND", "Activity not found");
  }
  res.json({ ok: true });
});
