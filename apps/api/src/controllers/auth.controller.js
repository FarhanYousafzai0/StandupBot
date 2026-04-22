import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import { User, toPublicUser } from "../models/User.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const registerSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().trim().max(120).optional().default(""),
  timezone: z.string().min(1).max(64).optional().default("UTC"),
  standupTime: z
    .string()
    .regex(/^\d{1,2}:\d{2}$/, "standupTime must be HH:MM (e.g. 17:00)")
    .optional()
    .default("17:00"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

function signToken(userId) {
  return jwt.sign({ sub: userId.toString() }, env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

export const register = asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new AppError(422, "VALIDATION_ERROR", first?.message || "Invalid body");
  }
  const { email, password, name, timezone, standupTime } = parsed.data;

  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError(409, "EMAIL_IN_USE", "An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    email,
    passwordHash,
    name,
    timezone,
    standupTime,
  });

  const token = signToken(user._id);
  res.status(201).json({
    user: toPublicUser(user),
    token,
  });
});

export const login = asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new AppError(422, "VALIDATION_ERROR", first?.message || "Invalid body");
  }
  const { email, password } = parsed.data;

  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  const token = signToken(user._id);
  res.json({
    user: toPublicUser(user),
    token,
  });
});
