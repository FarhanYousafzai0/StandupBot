import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    source: {
      type: String,
      required: true,
      enum: ["github", "jira", "vscode", "slack", "manual"],
    },
    type: { type: String, required: true, trim: true, maxlength: 120 },
    title: { type: String, required: true, trim: true, maxlength: 500 },
    description: { type: String, default: "", maxlength: 20000 },
    url: { type: String, default: "", maxlength: 2000 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, required: true, index: true },
    isBlocker: { type: Boolean, default: false },
    dedupKey: { type: String, required: true },
  },
  { timestamps: true }
);

activitySchema.index({ userId: 1, dedupKey: 1 }, { unique: true });

/**
 * @param {import("mongoose").Document | object} doc
 */
export function toPublicActivity(doc) {
  const id = (doc._id ?? doc.id).toString();
  const userId = doc.userId;
  const uid = typeof userId === "string" ? userId : userId.toString();
  const ts = doc.timestamp instanceof Date ? doc.timestamp : new Date(doc.timestamp);
  return {
    id,
    userId: uid,
    source: doc.source,
    type: doc.type,
    title: doc.title,
    description: doc.description,
    url: doc.url,
    metadata: doc.metadata,
    timestamp: ts.toISOString(),
    isBlocker: doc.isBlocker,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export const Activity = mongoose.model("Activity", activitySchema);
