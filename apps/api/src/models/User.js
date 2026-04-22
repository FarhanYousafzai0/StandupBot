import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "" },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    timezone: { type: String, default: "UTC" },
    slackUserId: { type: String, default: null },
    standupTime: { type: String, default: "17:00" },
  },
  { timestamps: true }
);

/**
 * @param {import("mongoose").Document} user
 * @returns {object}
 */
export function toPublicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    timezone: user.timezone,
    standupTime: user.standupTime,
    slackUserId: user.slackUserId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export const User = mongoose.model("User", userSchema);
