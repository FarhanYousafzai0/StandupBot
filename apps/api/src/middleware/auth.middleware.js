import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

/**
 * Verifies `Authorization: Bearer <jwt>` and sets `req.userId`.
 */
export function requireAuth(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) {
    return res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
    });
  }
  const token = h.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    const sub = typeof payload.sub === "string" ? payload.sub : null;
    if (!sub) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Invalid token" },
      });
    }
    req.userId = sub;
    return next();
  } catch {
    return res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Invalid or expired token" },
    });
  }
}
