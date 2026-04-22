import { env } from "../config/env.js";

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status =
    typeof err.status === "number"
      ? err.status
      : typeof err.statusCode === "number"
        ? err.statusCode
        : 500;
  const code =
    typeof err.code === "string"
      ? err.code
      : status === 404
        ? "NOT_FOUND"
        : "INTERNAL_ERROR";
  const isProd = env.NODE_ENV === "production";
  const message =
    status >= 500 && isProd ? "Internal server error" : err.message || "Internal server error";

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({ error: { code, message } });
}

// eslint-disable-next-line no-unused-vars
export function notFoundHandler(req, res, next) {
  const e = new Error("Not found");
  e.status = 404;
  e.code = "NOT_FOUND";
  next(e);
}
