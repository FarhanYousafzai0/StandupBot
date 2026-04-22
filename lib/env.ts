/**
 * Public env for browser (`.env.local`).
 * - Empty: same origin — in `next dev`, Next rewrites `/api` to Express (see `next.config.ts`).
 * - `http://localhost:3000`: same as empty for local dev; requests stay on the Next port.
 * - `http://localhost:5000` (or any other origin): call the API directly (no Next proxy for /api).
 */
export function getPublicApiUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    return "";
  }
  return url.replace(/\/$/, "");
}
