import { z } from "zod";
import { DateTime } from "luxon";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { User, toPublicUser } from "../models/User.js";

const patchSchema = z.object({
  name: z.string().max(200).optional(),
  timezone: z.string().min(1).max(80).optional(),
  standupTime: z
    .string()
    .regex(/^([01]?\d|2[0-3]):[0-5]\d$/, "standupTime must be HH:mm (e.g. 17:00)")
    .optional(),
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) {
    throw new AppError(404, "NOT_FOUND", "User not found");
  }
  res.json({ user: toPublicUser(user) });
});

export const patchMe = asyncHandler(async (req, res) => {
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new AppError(422, "VALIDATION_ERROR", first?.message || "Invalid body");
  }
  const b = parsed.data;
  if (Object.keys(b).length === 0) {
    throw new AppError(422, "VALIDATION_ERROR", "No valid fields to update");
  }
  if (b.timezone) {
    if (!DateTime.now().setZone(b.timezone).isValid) {
      throw new AppError(
        422,
        "VALIDATION_ERROR",
        "Invalid IANA timezone (e.g. Europe/London, America/New_York)"
      );
    }
  }
  const user = await User.findById(req.userId);
  if (!user) {
    throw new AppError(404, "NOT_FOUND", "User not found");
  }
  if (b.name !== undefined) {
    user.name = b.name;
  }
  if (b.timezone !== undefined) {
    user.timezone = b.timezone;
  }
  if (b.standupTime !== undefined) {
    const [hh, mm] = b.standupTime.split(":");
    user.standupTime = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  }
  await user.save();
  res.json({ user: toPublicUser(user) });
});
