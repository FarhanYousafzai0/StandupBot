export type Standup = {
  id: string;
  userId: string;
  date: string;
  rawActivityIds: string[];
  yesterday: string;
  today: string;
  blockers: string;
  editedContent: string;
  status: "draft" | "sent";
  sentTo: string[];
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StandupTodayResponse = {
  date: string;
  standup: Standup | null;
};

export type StandupResponse = { standup: Standup };
