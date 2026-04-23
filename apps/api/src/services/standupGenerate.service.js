import { User } from "../models/User.js";
import { Activity } from "../models/Activity.js";
import { Standup, toPublicStandup } from "../models/Standup.js";
import {
  getTodayYmdInZone,
  getUtcRangeForUserDay,
} from "../utils/dayRange.js";
import { generateStandupSections } from "./openai.service.js";

/**
 * @param {string} userId
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

/**
 * Regenerate / upsert today’s (or `ymd`) standup from activity + OpenAI.
 * @param {string} userId
 * @param {string} [dateYmd] - default today in user TZ
 */
export async function generateOrUpsertStandupForUser(userId, dateYmd) {
  const user = await User.findById(userId);
  if (!user) {
    return null;
  }
  const ymd = dateYmd && /^\d{4}-\d{2}-\d{2}$/.test(dateYmd)
    ? dateYmd
    : getTodayYmdInZone(user.timezone);

  const items = await activityPayloadForAI(userId, user.timezone, ymd);
  const payload = mapActivitiesForOpenAI(items);
  const ai = await generateStandupSections(payload);
  const ids = items.map((a) => a._id);
  const existing = await Standup.findOne({ userId, date: ymd });

  const setDoc = {
    userId,
    date: ymd,
    rawActivityIds: ids,
    yesterday: ai.yesterday,
    today: ai.today,
    blockers: ai.blockers,
    editedContent: existing?.editedContent ?? "",
    status: existing?.status ?? "draft",
    sentAt: existing?.sentAt ?? null,
    sentTo: existing?.sentTo ?? [],
  };

  const doc = await Standup.findOneAndUpdate(
    { userId, date: ymd },
    { $set: setDoc },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  return toPublicStandup(doc);
}
