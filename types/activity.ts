export type ActivitySource = "github" | "jira" | "vscode" | "slack" | "manual";

export type Activity = {
  id: string;
  userId: string;
  source: ActivitySource;
  type: string;
  title: string;
  description: string;
  url: string;
  metadata: Record<string, unknown>;
  timestamp: string;
  isBlocker: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ActivityListResponse = {
  date: string;
  timezone: string;
  activities: Activity[];
};
