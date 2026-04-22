export type PublicIntegration = {
  id: string;
  platform: "github" | "slack";
  github: { login: string | null; avatarUrl: string | null } | null;
  slack: { teamName: string | null; userName: string | null } | null;
  createdAt: string;
  updatedAt: string;
};

export type IntegrationsListResponse = {
  integrations: PublicIntegration[];
};
