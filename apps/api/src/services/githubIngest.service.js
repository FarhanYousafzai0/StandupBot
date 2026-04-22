import { Octokit } from "@octokit/rest";
import { Activity } from "../models/Activity.js";
import { User } from "../models/User.js";
import { Integration } from "../models/Integration.js";
import { decryptString } from "../utils/fieldCrypto.js";
import { makeGitHubEventDedupKey } from "../utils/dedupKey.js";

/**
 * @param {Record<string, unknown>} event
 * @returns {{ type: string, title: string, description: string, url: string, metadata: object } | null}
 */
function mapGithubEvent(event) {
  const repoName = event.repo?.name;
  const base = repoName ? `https://github.com/${repoName}` : null;

  switch (event.type) {
    case "PushEvent": {
      const commits = event.payload?.commits || [];
      const title = repoName ? `Push to ${repoName}` : "Push";
      const desc = commits
        .map((c) => c.message)
        .filter(Boolean)
        .join("\n")
        .slice(0, 8000);
      const first = commits[0];
      let url = "";
      if (first?.sha && repoName) {
        url = `https://github.com/${repoName}/commit/${first.sha}`;
      } else if (first?.url) {
        url = first.url
          .replace("https://api.github.com/repos/", "https://github.com/")
          .replace(/\/commits\//, "/commit/");
      }
      if (!url) url = base || "";
      return {
        type: "push",
        title,
        description: desc,
        url,
        metadata: { ref: event.payload?.ref || "" },
      };
    }
    case "PullRequestEvent": {
      const pr = event.payload?.pull_request;
      if (!pr) {
        return null;
      }
      return {
        type: "pull_request",
        title: pr.title || "Pull request",
        description: String(pr.body || "").slice(0, 2000),
        url: pr.html_url || "",
        metadata: { action: event.payload?.action || "" },
      };
    }
    case "IssuesEvent": {
      const issue = event.payload?.issue;
      if (!issue) {
        return null;
      }
      return {
        type: "issue",
        title: issue.title || "Issue",
        description: String(issue.body || "").slice(0, 2000),
        url: issue.html_url || "",
        metadata: { action: event.payload?.action || "" },
      };
    }
    case "CreateEvent": {
      const ref = event.payload?.ref || "";
      const refType = event.payload?.ref_type || "ref";
      return {
        type: "create",
        title: `Created ${refType} ${ref}`.trim(),
        description: "",
        url: base || "",
        metadata: {},
      };
    }
    default:
      return null;
  }
}

/**
 * @param {import("mongoose").Document} integration — must have encryptedAccessToken
 * @returns {Promise<{ created: number }>}
 */
export async function ingestGithubEventsForUser(integration) {
  const userId = integration.userId;
  const uid = userId.toString();
  const token = decryptString(integration.encryptedAccessToken);
  const octokit = new Octokit({ auth: token });
  const { data: events } = await octokit.rest.activity.listEventsForAuthenticatedUser({
    per_page: 30,
  });
  const user = await User.findById(userId);
  if (!user) {
    return { created: 0 };
  }

  let created = 0;
  for (const event of events) {
    const mapped = mapGithubEvent(/** @type {Record<string, unknown>} */ (event));
    if (!mapped) {
      continue;
    }
    const dedupKey = makeGitHubEventDedupKey(uid, String(event.id));
    try {
      await Activity.create({
        userId,
        source: "github",
        type: mapped.type,
        title: mapped.title,
        description: mapped.description,
        url: mapped.url,
        metadata: {
          githubEventId: event.id,
          githubType: event.type,
          ...mapped.metadata,
        },
        timestamp: new Date(event.created_at),
        isBlocker: false,
        dedupKey,
      });
      created += 1;
    } catch (e) {
      if (e && (e.code === 11000 || e.code === "11000")) {
        continue;
      }
      throw e;
    }
  }
  return { created };
}

/**
 * Hourly job: all GitHub integrations.
 * @returns {Promise<void>}
 */
export async function runGithubFetchForAllUsers() {
  const list = await Integration.find({ platform: "github" }).select(
    "+encryptedAccessToken"
  );

  for (const doc of list) {
    try {
      const n = await ingestGithubEventsForUser(doc);
      if (n.created > 0) {
        console.log(
          `[github] user ${String(doc.userId)}: +${n.created} activities`
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(
        `[github] ingest failed for user ${String(doc.userId)}:`,
        msg
      );
    }
  }
}
