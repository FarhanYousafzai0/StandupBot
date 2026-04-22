/** Match `source` in Activity (API) — display order and labels */
export const ACTIVITY_SOURCE_ORDER = [
  "github",
  "slack",
  "manual",
  "jira",
  "vscode",
] as const;

const LABELS: Record<string, string> = {
  github: "GitHub",
  slack: "Slack",
  manual: "Manual",
  jira: "Jira",
  vscode: "VS Code",
};

export function getActivitySourceLabel(source: string): string {
  return LABELS[source] ?? source.charAt(0).toUpperCase() + source.slice(1);
}
