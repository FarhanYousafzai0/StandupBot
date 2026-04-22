import { z } from "zod";
import mongoose from "mongoose";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { User } from "../models/User.js";
import { Activity } from "../models/Activity.js";
import { Standup, toPublicStandup } from "../models/Standup.js";
import {
  getTodayYmdInZone,
  getUtcRangeForUserDay,
} from "../utils/dayRange.js";
import { generateStandupSections } from "../services/openai.service.js";

const putBodySchema = z.object({
  yesterday: z.string().max(50000).optional(),
  today: z.string().max(50000).optional(),
  blockers: z.string().max(50000).optional(),
  editedContent: z.string().max(100000).optional(),
  status: z.enum(["draft", "sent"]).optional(),
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
function activityPayloadForAI(userId, timeZone, ymd) {
  const { start, end } = getUtcRangeForUserDay(ymd, timeZone);
  return Activity.find({
    userId,
    timestamp: { $gte: start, $lte: end },
  })
    .sort({ timestamp: -1 })
    .lean();
}

/**
 * @param {object[]} items
 */
function mapActivitiesForOpenAI(items) {
  return items.map((a) => ({
    source: a.source,
    type: a.type,
    title: a.title,
    description: a.description || "",
    url: a.url || "",
    isBlocker: a.isBlocker,
    at: a.timestamp ? new Date(a.timestamp).toISOString() : null,
  }));
}

export const getToday = asyncHandler(async (req, res) => {
  const user = await loadUserOr404(req.userId);
  const ymd = getTodayYmdInZone(user.timezone);
  const doc = await Standup.findOne({ userId: req.userId, date: ymd });
  res.json({ date: ymd, standup: doc ? toPublicStandup(doc) : null });
});

export const generate = asyncHandler(async (req, res) => {
  const user = await loadUserOr404(req.userId);
  let ymd = getTodayYmdInZone(user.timezone);
  if (req.body && req.body.date != null && String(req.body.date).length > 0) {
    const s = String(req.body.date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      throw new AppError(422, "VALIDATION_ERROR", "date must be YYYY-MM-DD");
    }
    ymd = s;
  }

  const items = await activityPayloadForAI(req.userId, user.timezone, ymd);
  const payload = mapActivitiesForOpenAI(items);
  const ai = await generateStandupSections(payload);
  const ids = items.map((a) => a._id);

  const setDoc = {
    userId: req.userId,
    date: ymd,
    rawActivityIds: ids,
    yesterday: ai.yesterday,
    today: ai.today,
    blockers: ai.blockers,
    editedContent: "",
    status: "draft",
  };

  const doc = await Standup.findOneAndUpdate(
    { userId: req.userId, date: ymd },
    { $set: setDoc },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  res.status(201).json({ standup: toPublicStandup(doc) });
});

export const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(422, "VALIDATION_ERROR", "Invalid standup id");
  }

  const parsed = putBodySchema.safeParse(req.body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new AppError(422, "VALIDATION_ERROR", first?.message || "Invalid body");
  }

  const doc = await Standup.findOne({ _id: id, userId: req.userId });
  if (!doc) {
    throw new AppError(404, "NOT_FOUND", "Standup not found");
  }

  const b = parsed.data;
  if (b.yesterday !== undefined) {
    doc.yesterday = b.yesterday;
  }
  if (b.today !== undefined) {
    doc.today = b.today;
  }
  if (b.blockers !== undefined) {
    doc.blockers = b.blockers;
  }
  if (b.editedContent !== undefined) {
    doc.editedContent = b.editedContent;
  }
  if (b.status !== undefined) {
    doc.status = b.status;
  }

  await doc.save();
  res.json({ standup: toPublicStandup(doc) });
});
