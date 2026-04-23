import rateLimit from "express-rate-limit";

function jsonHandler() {
  return {
    error: {
      code: "RATE_LIMITED",
      message: "Too many requests. Try again later.",
    },
  };
}

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler(_req, res) {
    res.status(429).json(jsonHandler());
  },
});

export const oauthRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false,
  handler(_req, res) {
    res.status(429).json(jsonHandler());
  },
});
