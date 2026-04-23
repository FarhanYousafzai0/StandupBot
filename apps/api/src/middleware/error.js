import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { AppError } from "../utils/AppError.js";

const isProd = () => env.NODE_ENV === "production";

export function errorHandler(err, req, res, _next) {
  const prod = isProd();
  void _next;
  const log = req.log || logger;

  if (err instanceof AppError) {
    if (err.status >= 500) {
      log.error({ err }, "Application error");
    }
    const message =
      prod && err.status >= 500
        ? "Internal server error"
        : err.message;
    return res
      .status(err.status)
      .json({ error: { code: err.code, message } });
  }

  if (err?.name === "ValidationError") {
    return res.status(422).json({
      error: {
        code: "VALIDATION_ERROR",
        message: prod ? "Validation failed" : err.message,
      },
    });
  }

  if (err?.name === "CastError") {
    return res.status(400).json({
      error: {
        code: "BAD_REQUEST",
        message: prod ? "Invalid id" : err.message,
      },
    });
  }

  if (err?.code === 11000 || err?.code === "11000") {
    return res.status(409).json({
      error: {
        code: "DUPLICATE_KEY",
        message: "A record with this value already exists",
      },
    });
  }

  log.error({ err }, "Unhandled error");
  return res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: prod
        ? "Internal server error"
        : (err && err.message) || "Internal server error",
    },
  });
}

export function notFoundHandler(req, res, next) {
  next(new AppError(404, "NOT_FOUND", "Not found"));
}
