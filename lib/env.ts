/**
 * Public env for browser. Set in `.env.local`:
 * `NEXT_PUBLIC_API_URL=http://localhost:5000`
 */
export function getPublicApiUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    return "";
  }
  return url.replace(/\/$/, "");
}
