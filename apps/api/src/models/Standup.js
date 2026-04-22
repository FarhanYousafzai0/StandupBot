import mongoose from "mongoose";

const standupSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    /** YYYY-MM-DD in the user's local calendar (same convention as activities / plan) */
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    rawActivityIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Activity" },
    ],
    yesterday: { type: String, default: "" },
    today: { type: String, default: "" },
    blockers: { type: String, default: "" },
    /** User-edited full text shown in UI (overrides display when set after save) */
    editedContent: { type: String, default: "" },
    status: { type: String, enum: ["draft", "sent"], default: "draft" },
    sentTo: { type: [String], default: [] },
    sentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

standupSchema.index({ userId: 1, date: 1 }, { unique: true });

/**
 * @param {import("mongoose").Document} doc
 */
export function toPublicStandup(doc) {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    date: doc.date,
    rawActivityIds: (doc.rawActivityIds || []).map((id) => id.toString()),
    yesterday: doc.yesterday,
    today: doc.today,
    blockers: doc.blockers,
    editedContent: doc.editedContent,
    status: doc.status,
    sentTo: doc.sentTo,
    sentAt: doc.sentAt ? new Date(doc.sentAt).toISOString() : null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export const Standup = mongoose.model("Standup", standupSchema);
