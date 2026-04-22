/**
 * Public user object returned by the API (no secrets).
 * Mirrors `toPublicUser` in `apps/api`.
 */
export type PublicUser = {
  id: string;
  name: string;
  email: string;
  timezone: string;
  standupTime: string;
  slackUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuthResponse = {
  user: PublicUser;
  token: string;
};
