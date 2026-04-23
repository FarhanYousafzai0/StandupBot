import request from "supertest";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

Object.assign(process.env, {
  NODE_ENV: "test",
  MONGODB_URI: "mongodb://localhost/test",
  JWT_SECRET: "test-secret-123",
  WEB_ORIGIN: "http://localhost:3000",
  API_PUBLIC_URL: "http://localhost:5000",
});

async function loadApp() {
  vi.resetModules();

  const userModel = {
    findOne: vi.fn(async () => null),
    create: vi.fn(async (doc: Record<string, unknown>) => ({
      _id: new Types.ObjectId(),
      name: doc.name || "",
      email: doc.email,
      timezone: doc.timezone,
      standupTime: doc.standupTime,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    findById: vi.fn(async () => ({
      _id: new Types.ObjectId(),
      email: "dev@example.com",
      timezone: "UTC",
      standupTime: "17:00",
    })),
  };

  vi.doMock("../../src/config/db.js", () => ({
    isDbReadyForApi: () => true,
  }));
  vi.doMock("../../src/models/User.js", () => ({
    User: userModel,
    toPublicUser: (user: {
      _id: { toString: () => string };
      name?: string;
      email: string;
      timezone?: string;
      standupTime?: string;
      createdAt?: Date;
      updatedAt?: Date;
    }) => ({
      id: user._id.toString(),
      name: user.name || "",
      email: user.email,
      timezone: user.timezone || "UTC",
      standupTime: user.standupTime || "17:00",
      slackUserId: null,
      createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: user.updatedAt?.toISOString() || new Date().toISOString(),
    }),
  }));
  vi.doMock("../../src/models/Standup.js", () => ({
    Standup: {
      findOne: vi.fn(async () => null),
    },
    toPublicStandup: (doc: unknown) => doc,
  }));
  vi.doMock("../../src/models/Activity.js", () => ({
    Activity: {
      find: vi.fn(),
      create: vi.fn(),
      findOneAndDelete: vi.fn(),
    },
    toPublicActivity: (doc: unknown) => doc,
  }));
  vi.doMock("../../src/models/Integration.js", () => ({
    Integration: {
      find: vi.fn(async () => []),
      findOne: vi.fn(async () => null),
      findOneAndDelete: vi.fn(),
      findOneAndUpdate: vi.fn(),
    },
    toPublicIntegration: (doc: unknown) => doc,
  }));
  vi.doMock("../../src/services/standupGenerate.service.js", () => ({
    generateOrUpsertStandupForUser: vi.fn(),
  }));

  const { app } = await import("../../src/app.js");
  return { app, userModel };
}

function authToken(userId = new Types.ObjectId().toString()) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET!, { expiresIn: "1h" });
}

describe("auth and standup routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid timezone on register", async () => {
    const { app } = await loadApp();

    const res = await request(app).post("/api/auth/register").send({
      email: "bad-timezone@example.com",
      password: "password123",
      timezone: "Mars/Olympus",
      standupTime: "17:00",
    });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.message).toContain("Invalid IANA timezone");
  });

  it("rejects invalid standup time on register", async () => {
    const { app } = await loadApp();

    const res = await request(app).post("/api/auth/register").send({
      email: "bad-time@example.com",
      password: "password123",
      timezone: "UTC",
      standupTime: "25:99",
    });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.message).toContain("standupTime");
  });

  it("rejects impossible standup generation dates with 422", async () => {
    const { app } = await loadApp();

    const res = await request(app)
      .post("/api/standup/generate")
      .set("Authorization", `Bearer ${authToken()}`)
      .send({ date: "2026-02-31" });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.message).toContain("real calendar date");
  });

  it("does not allow generic standup updates to fake sent status", async () => {
    const { app } = await loadApp();

    const res = await request(app)
      .put(`/api/standup/${new Types.ObjectId().toString()}`)
      .set("Authorization", `Bearer ${authToken()}`)
      .send({ status: "sent" });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.message).toContain("No valid standup fields");
  });
});
