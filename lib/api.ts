import { getPublicApiUrl } from "./env";

const base = () => getPublicApiUrl();

/**
 * Typed fetch wrapper for the StandupBot API (Phase 3: add auth header from store).
 */
export async function apiFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const root = base();
  if (!root) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not set. Add it to .env.local (see .env.local.example)."
    );
  }
  const url = path.startsWith("http") ? path : `${root}${path.startsWith("/") ? "" : "/"}${path}`;
  return fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}
