import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

Object.assign(process.env, {
  NODE_ENV: "test",
  MONGODB_URI: "mongodb://localhost/test",
  JWT_SECRET: "test-secret-123",
  WEB_ORIGIN: "http://localhost:3000",
  API_PUBLIC_URL: "http://localhost:5000",
});

describe("github ingest service", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("ingests paginated GitHub events without duplicating reruns", async () => {
    const userId = new Types.ObjectId().toString();
    const created = new Map<string, { title: string }>();

    vi.doMock("../../src/utils/fieldCrypto.js", () => ({
      decryptString: vi.fn(() => "github-token"),
    }));
    vi.doMock("@octokit/rest", () => {
      class Octokit {
        rest = {
          activity: {
            listEventsForAuthenticatedUser: vi.fn(),
          },
        };

        paginate = {
          iterator: async function* iterator() {
            yield {
              data: [
                {
                  id: "evt-1",
                  type: "PushEvent",
                  created_at: "2026-04-24T08:00:00.000Z",
                  repo: { name: "acme/standbot" },
                  payload: {
                    ref: "refs/heads/main",
                    commits: [{ message: "feat: add activity pagination", sha: "abc123" }],
                  },
                },
              ],
            };
            yield {
              data: [
                {
                  id: "evt-2",
                  type: "PullRequestEvent",
                  created_at: "2026-04-24T09:00:00.000Z",
                  repo: { name: "acme/standbot" },
                  payload: {
                    action: "opened",
                    pull_request: {
                      title: "Fix standup regeneration",
                      body: "Preserve edited content and send state.",
                      html_url: "https://github.com/acme/standbot/pull/42",
                    },
                  },
                },
              ],
            };
          },
        };
      }

      return { Octokit };
    });
    vi.doMock("../../src/models/User.js", () => ({
      User: {
        findById: vi.fn(async () => ({
          _id: userId,
          timezone: "UTC",
        })),
      },
    }));
    vi.doMock("../../src/models/Integration.js", () => ({
      Integration: {
        find: vi.fn(),
      },
    }));
    vi.doMock("../../src/models/Activity.js", () => ({
      Activity: {
        create: vi.fn(async (doc: {
          metadata: { githubEventId: string };
          title: string;
        }) => {
          const eventId = doc.metadata.githubEventId;
          if (created.has(eventId)) {
            const error = new Error("duplicate");
            Object.assign(error, { code: 11000 });
            throw error;
          }
          created.set(eventId, { title: doc.title });
          return doc;
        }),
      },
    }));

    const { ingestGithubEventsForUser } = await import("../../src/services/githubIngest.service.js");
    const integration = {
      userId,
      encryptedAccessToken: "encrypted-token",
    };

    const firstRun = await ingestGithubEventsForUser(integration as never);
    const secondRun = await ingestGithubEventsForUser(integration as never);

    expect(firstRun.created).toBe(2);
    expect(secondRun.created).toBe(0);
    expect([...created.values()].map((item) => item.title)).toEqual([
      "Push to acme/standbot",
      "Fix standup regeneration",
    ]);
  });
});
