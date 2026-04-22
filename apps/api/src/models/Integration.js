import mongoose from "mongoose";

const integrationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    platform: {
      type: String,
      required: true,
      enum: ["github", "slack"],
    },
    encryptedAccessToken: { type: String, required: true, select: false },
    /** GitHub may return scope string; set when saving */
    tokenExpiresAt: { type: Date, default: null },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

integrationSchema.index({ userId: 1, platform: 1 }, { unique: true });

/**
 * Safe JSON for the API — no tokens.
 * @param {import("mongoose").Document} doc
 */
export function toPublicIntegration(doc) {
  const m = doc.metadata && typeof doc.metadata === "object" ? doc.metadata : {};
  return {
    id: doc._id.toString(),
    platform: doc.platform,
    github: doc.platform === "github" ? { login: m.githubLogin ?? null, avatarUrl: m.avatarUrl ?? null } : null,
    slack:
      doc.platform === "slack"
        ? { teamName: m.teamName ?? null, userName: m.slackUserName ?? null }
        : null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export const Integration = mongoose.model("Integration", integrationSchema);
