import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { isDbReadyForApi } from "./config/db.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import activityRoutes from "./routes/activity.routes.js";
import standupRoutes from "./routes/standup.routes.js";
import integrationRoutes from "./routes/integration.routes.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.WEB_ORIGIN,
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json());

app.use("/api", (req, res, next) => {
  if (!isDbReadyForApi()) {
    return res.status(503).json({
      error: {
        code: "DATABASE_UNAVAILABLE",
        message:
          "Database is offline. Set MONGODB_URI (or MONGODB_URI_DIRECT) in apps/api/.env and ensure MongoDB is reachable (see API server log).",
      },
    });
  }
  next();
});

app.use("/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/standup", standupRoutes);
app.use("/api/integrations", integrationRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
