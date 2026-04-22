/**
 * @param {{ date: string, yesterday: string, today: string, blockers: string, editedContent?: string }} s
 * @returns {string}
 */
export function formatStandupAsMrkdwn(s) {
  if (s.editedContent && String(s.editedContent).trim().length > 0) {
    return String(s.editedContent).trim().slice(0, 40000);
  }
  return [
    `*Standup — ${s.date}*`,
    `*✅ Yesterday*\n${(s.yesterday && s.yesterday.trim()) || "—"}`,
    `*🔨 Today*\n${(s.today && s.today.trim()) || "—"}`,
    `*🚧 Blockers*\n${(s.blockers && s.blockers.trim()) || "—"}`,
  ]
    .join("\n\n")
    .slice(0, 40000);
}
