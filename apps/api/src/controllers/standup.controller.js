import { z } from "zod";
import mongoose from "mongoose";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { User } from "../models/User.js";
import { Standup, toPublicStandup } from "../models/Standup.js";
import { getTodayYmdInZone } from "../utils/dayRange.js";
import { generateOrUpsertStandupForUser } from "../services/standupGenerate.service.js";
import { formatStandupAsMrkdwn } from "../services/standupFormat.service.js";
import { Integration } from "../models/Integration.js";
import { decryptString } from "../utils/fieldCrypto.js";
import {
  postToChannel,
  postToUserDirectMessage,
} from "../services/slackMessage.service.js";
import { isValidCalendarDate } from "../utils/validation.js";

const putBodySchema = z.object({
  yesterday: z.string().max(50000).optional(),
  today: z.string().max(50000).optional(),
  blockers: z.string().max(50000).optional(),
  editedContent: z.string().max(100000).optional(),
});

const sendBodySchema = z.object({
  /** Slack channel ID (C… or D…). If omitted, DM the connected user. */
  channel: z.string().min(1).max(32).optional(),
});

async function loadUserOr404(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, "NOT_FOUND", "User not found");
  }
  return user;
}

export const getToday = asyncHandler(async (req, res) => {
  const user = await loadUserOr404(req.userId);
  const ymd = getTodayYmdInZone(user.timezone);
  const doc = await Standup.findOne({ userId: req.userId, date: ymd });
  res.json({ date: ymd, standup: doc ? toPublicStandup(doc) : null });
});

/**
 * Paginated past standups (newest first). Pass `before` (YYYY-MM-DD) to load older pages.
 */
export const listHistory = asyncHandler(async (req, res) => {
  const rawLimit = req.query.limit;
  const limit = Math.min(
    50,
    Math.max(1, parseInt(String(rawLimit ?? "20"), 10) || 20)
  );
  const before = req.query.before;
  const q = { userId: req.userId };
  if (before != null && String(before).length > 0) {
    const s = String(before);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      throw new AppError(422, "VALIDATION_ERROR", "before must be YYYY-MM-DD");
    }
    q.date = { $lt: s };
  }
  const items = await Standup.find(q)
    .sort({ date: -1 })
    .limit(limit + 1)
    .lean();
  const hasMore = items.length > limit;
  const slice = hasMore ? items.slice(0, limit) : items;
  const nextBeforeDate =
    hasMore && slice.length > 0 ? slice[slice.length - 1].date : null;
  res.json({
    standups: slice.map((d) => toPublicStandup(d)),
    nextBeforeDate,
  });
});

export const generate = asyncHandler(async (req, res) => {
  await loadUserOr404(req.userId);
  let ymd;
  if (req.body && req.body.date != null && String(req.body.date).length > 0) {
    const s = String(req.body.date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      throw new AppError(422, "VALIDATION_ERROR", "date must be YYYY-MM-DD");
    }
    const user = await loadUserOr404(req.userId);
    if (!isValidCalendarDate(s, user.timezone)) {
      throw new AppError(422, "VALIDATION_ERROR", "date must be a real calendar date");
    }
    ymd = s;
  } else {
    ymd = undefined;
  }
  const standup = await generateOrUpsertStandupForUser(req.userId, ymd);
  if (!standup) {
    throw new AppError(404, "NOT_FOUND", "User not found");
  }
  res.status(201).json({ standup });
});

export const send = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(422, "VALIDATION_ERROR", "Invalid standup id");
  }
  const parsed = sendBodySchema.safeParse(req.body || {});
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new AppError(422, "VALIDATION_ERROR", first?.message || "Invalid body");
  }

  const doc = await Standup.findOne({ _id: id, userId: req.userId });
  if (!doc) {
    throw new AppError(404, "NOT_FOUND", "Standup not found");
  }

  const integration = await Integration.findOne({
    userId: req.userId,
    platform: "slack",
  }).select("+encryptedAccessToken");
  if (!integration) {
    throw new AppError(400, "SLACK_NOT_CONNECTED", "Connect Slack in Settings first");
  }
  const token = decryptString(integration.encryptedAccessToken);
  const meta = integration.metadata && typeof integration.metadata === "object" ? integration.metadata : {};
  const slackUserId = meta.slackUserId;
  if (!parsed.data.channel && !slackUserId) {
    throw new AppError(400, "SLACK_NO_USER", "Slack user id missing; reconnect Slack");
  }

  const text = formatStandupAsMrkdwn(doc);
  const dest = parsed.data.channel;
  if (dest) {
    await postToChannel({ token, channel: dest, text });
  } else {
    await postToUserDirectMessage({
      token,
      slackUserId: String(slackUserId),
      text,
    });
  }

  doc.status = "sent";
  doc.sentAt = new Date();
  const label = dest ? `channel:${dest}` : "dm";
  if (!Array.isArray(doc.sentTo)) {
    doc.sentTo = [];
  }
  doc.markModified("sentTo");
  if (!doc.sentTo.includes(`slack:${label}`)) {
    doc.sentTo.push(`slack:${label}`);
  }
  await doc.save();

  res.json({ standup: toPublicStandup(doc) });
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
  if (Object.keys(parsed.data).length === 0) {
    throw new AppError(422, "VALIDATION_ERROR", "No valid standup fields to update");
  }

  const docu = await Standup.findOne({ _id: id, userId: req.userId });
  if (!docu) {
    throw new AppError(404, "NOT_FOUND", "Standup not found");
  }

  const b = parsed.data;
  if (b.yesterday !== undefined) {
    docu.yesterday = b.yesterday;
  }
  if (b.today !== undefined) {
    docu.today = b.today;
  }
  if (b.blockers !== undefined) {
    docu.blockers = b.blockers;
  }
  if (b.editedContent !== undefined) {
    docu.editedContent = b.editedContent;
  }
  await docu.save();
  res.json({ standup: toPublicStandup(docu) });
});
