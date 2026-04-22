import cron from "node-cron";
import { isDbConnected } from "../config/db.js";
import { User } from "../models/User.js";
import { Integration } from "../models/Integration.js";
import { decryptString } from "../utils/fieldCrypto.js";
import {
  getTodayYmdInZone,
  isUserInCurrentStandupQuarter,
} from "../utils/dayRange.js";
import { generateOrUpsertStandupForUser } from "../services/standupGenerate.service.js";
import { postDraftReadyPing } from "../services/slackMessage.service.js";

/**
 * Every 15 minutes: for users whose `standupTime` falls in the current quarter-hour
 * in their timezone, create/update today’s standup and optionally Slack-DM a link.
 */
export function startGenerateStandupJob() {
  cron.schedule("*/15 * * * *", async () => {
    if (!isDbConnected()) {
      return;
    }
    const users = await User.find({}).lean();
    for (const u of users) {
      const tz = u.timezone || "UTC";
      const st = u.standupTime || "17:00";
      const ymd = getTodayYmdInZone(tz);
      if (!isUserInCurrentStandupQuarter(tz, st)) {
        continue;
      }
      if (u.lastAutoDraftYmd === ymd) {
        continue;
      }
      const uid = u._id.toString();
      try {
        await generateOrUpsertStandupForUser(uid);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[job] standup generate failed for user ${uid}:`, msg);
        continue;
      }
      await User.findByIdAndUpdate(u._id, { $set: { lastAutoDraftYmd: ymd } });
      const int = await Integration.findOne({
        userId: u._id,
        platform: "slack",
      }).select("+encryptedAccessToken");
      if (!int) {
        continue;
      }
      const m = int.metadata && typeof int.metadata === "object" ? int.metadata : {};
      const su = m.slackUserId;
      if (!su) {
        continue;
      }
      try {
        const tok = decryptString(int.encryptedAccessToken);
        await postDraftReadyPing({
          token: tok,
          slackUserId: String(su),
          dateYmd: ymd,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[job] standup slack ping for user ${uid}:`, msg);
      }
    }
  });
  console.log("[job] generateStandup: scheduled every 15m");
}
