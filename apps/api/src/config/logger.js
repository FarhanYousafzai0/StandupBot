import { randomUUID } from "node:crypto";
import pino from "pino";
import pinoHttp from "pino-http";
import { env } from "./env.js";

const level = env.NODE_ENV === "production" ? "info" : "debug";

export const logger = pino({
  level,
  transport:
    env.NODE_ENV === "production"
      ? undefined
      : {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "SYS:standard" },
        },
});

export const requestLogger = pinoHttp({
  logger,
  genReqId(req, res) {
    const requestId = req.headers["x-request-id"];
    if (typeof requestId === "string" && requestId.trim()) {
      res.setHeader("x-request-id", requestId);
      return requestId;
    }
    const id = randomUUID();
    res.setHeader("x-request-id", id);
    return id;
  },
  customLogLevel(req, res, err) {
    if (err || res.statusCode >= 500) {
      return "error";
    }
    if (res.statusCode >= 400) {
      return "warn";
    }
    if (req.url === "/health") {
      return "silent";
    }
    return "info";
  },
});
