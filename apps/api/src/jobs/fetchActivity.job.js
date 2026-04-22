import cron from "node-cron";
import { isDbConnected } from "../config/db.js";
import { runGithubFetchForAllUsers } from "../services/githubIngest.service.js";

/**
 * Fetches recent GitHub events into Activity for all connected users (hourly).
 */
export function startFetchActivityJob() {
  cron.schedule("0 * * * *", async () => {
    if (!isDbConnected()) {
      return;
    }
    try {
      await runGithubFetchForAllUsers();
    } catch (e) {
      console.error("[job] fetchActivity:", e);
    }
  });
  console.log("[job] fetchActivity: scheduled (hourly, :00)");
}
