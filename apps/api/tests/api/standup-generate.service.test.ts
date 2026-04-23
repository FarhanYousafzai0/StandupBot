import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

Object.assign(process.env, {
  NODE_ENV: "test",
  MONGODB_URI: "mongodb://localhost/test",
  JWT_SECRET: "test-secret-123",
  WEB_ORIGIN: "http://localhost:3000",
  API_PUBLIC_URL: "http://localhost:5000",
  OPENAI_API_KEY: "test-openai-key",
});

describe("standup generation service", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("preserves user edits and sent metadata when regenerating an existing standup", async () => {
    const userId = new Types.ObjectId().toString();
    const standupId = new Types.ObjectId().toString();
    const activityId = new Types.ObjectId().toString();
    const sentAt = new Date("2026-04-24T10:00:00.000Z");
    let updatePayload: Record<string, unknown> | null = null;

    vi.doMock("../../src/services/openai.service.js", () => ({
      generateStandupSections: vi.fn(async () => ({
        yesterday: "- synced pull requests",
        today: "- review CI fixes",
        blockers: "None",
      })),
    }));
    vi.doMock("../../src/models/User.js", () => ({
      User: {
        findById: vi.fn(async () => ({
          _id: userId,
          email: "saved-standup@example.com",
          timezone: "UTC",
        })),
      },
    }));
    vi.doMock("../../src/models/Activity.js", () => ({
      Activity: {
        find: vi.fn(() => ({
          sort: vi.fn(() => ({
            lean: vi.fn(async () => [
              {
                _id: activityId,
                source: "manual",
                type: "note",
                title: "Reviewed pagination",
                description: "Made GitHub sync fetch multiple pages.",
                url: "",
                timestamp: new Date("2026-04-24T09:00:00.000Z"),
                isBlocker: false,
              },
            ]),
          })),
        })),
      },
    }));
    vi.doMock("../../src/models/Standup.js", () => ({
      Standup: {
        findOne: vi.fn(async () => ({
          _id: standupId,
          userId,
          date: "2026-04-24",
          editedContent: "Custom hand-written standup",
          status: "sent",
          sentAt,
          sentTo: ["slack:dm"],
        })),
        findOneAndUpdate: vi.fn(async (_query: unknown, update: { $set: Record<string, unknown> }) => {
          updatePayload = update.$set;
          return {
            _id: standupId,
            userId,
            date: "2026-04-24",
            rawActivityIds: update.$set.rawActivityIds,
            yesterday: update.$set.yesterday,
            today: update.$set.today,
            blockers: update.$set.blockers,
            editedContent: update.$set.editedContent,
            status: update.$set.status,
            sentAt: update.$set.sentAt,
            sentTo: update.$set.sentTo,
            createdAt: new Date("2026-04-24T00:00:00.000Z"),
            updatedAt: new Date("2026-04-24T11:00:00.000Z"),
          };
        }),
      },
      toPublicStandup: (doc: {
        _id: string;
        userId: string;
        date: string;
        rawActivityIds: unknown[];
        yesterday: string;
        today: string;
        blockers: string;
        editedContent: string;
        status: "draft" | "sent";
        sentAt: Date | null;
        sentTo: string[];
        createdAt: Date;
        updatedAt: Date;
      }) => ({
        id: doc._id,
        userId: doc.userId,
        date: doc.date,
        rawActivityIds: doc.rawActivityIds.map(String),
        yesterday: doc.yesterday,
        today: doc.today,
        blockers: doc.blockers,
        editedContent: doc.editedContent,
        status: doc.status,
        sentAt: doc.sentAt?.toISOString() ?? null,
        sentTo: doc.sentTo,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      }),
    }));

    const { generateOrUpsertStandupForUser } = await import("../../src/services/standupGenerate.service.js");
    const result = await generateOrUpsertStandupForUser(userId, "2026-04-24");
    if (!result) {
      throw new Error("Expected standup result");
    }

    expect(updatePayload).toMatchObject({
      editedContent: "Custom hand-written standup",
      status: "sent",
      sentAt,
      sentTo: ["slack:dm"],
    });
    expect(result.editedContent).toBe("Custom hand-written standup");
    expect(result.status).toBe("sent");
    expect(result.sentAt).toBe(sentAt.toISOString());
    expect(result.sentTo).toEqual(["slack:dm"]);
    expect(result.yesterday).toBe("- synced pull requests");
    expect(result.today).toBe("- review CI fixes");
  });
});
