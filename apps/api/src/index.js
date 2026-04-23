import { connectDB, isDbConnected } from "./config/db.js";
import { env } from "./config/env.js";
import { app } from "./app.js";
import { logger } from "./config/logger.js";
import { startFetchActivityJob } from "./jobs/fetchActivity.job.js";
import { startGenerateStandupJob } from "./jobs/generateStandup.job.js";

function logMongoError(err) {
  const message = err instanceof Error ? err.message : String(err);
  logger.error({ err }, "MongoDB connection failed");
  if (message.includes("querySrv") || message.includes("_mongodb._tcp")) {
    logger.error(
      "-> If SRV/DNS to Atlas is blocked, use the standard (non-srv) connection string in Atlas, " +
        "or run MongoDB locally. See README: MongoDB / Atlas (querySrv)."
    );
  }
}

function scheduleDbRetry() {
  const interval = setInterval(async () => {
    if (isDbConnected()) {
      clearInterval(interval);
      return;
    }
    try {
      await connectDB();
      logger.info("MongoDB connected (after retry).");
      clearInterval(interval);
    } catch (err) {
      logMongoError(err);
    }
  }, 10_000);
}

function start() {
  // Start MongoDB before opening HTTP so readyState is usually "connecting" (2) not idle (0)
  connectDB()
    .then(() => {
      logger.info("MongoDB connected.");
    })
    .catch((err) => {
      logMongoError(err);
      logger.error(
        "API is up; /api returns 503 until the database is reachable."
      );
      scheduleDbRetry();
    });

  app.listen(env.PORT, () => {
    logger.info(`API listening on http://localhost:${env.PORT}`);
  });
  startFetchActivityJob();
  startGenerateStandupJob();
}

start();
