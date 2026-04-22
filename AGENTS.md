# StandupBot — agent context

## Product

Developer productivity app: **daily standup drafts** from tracked activity (GitHub, Slack, etc.). See **`IMPLEMENTATION_PLAN.md`**.

**Folder layout** (`app/` vs `apps/`): see the **Folder layout** section in **`README.md`**.

## Stack (this repo)

- **Frontend:** Next.js (App Router) at **repo root** — `app/`, `components/`, `lib/` — dashboard (activity by source), **Settings** (profile + integrations), **History** (paginated standups)
- **Backend:** Express API in **`apps/api/`** (npm workspace `api`). In **dev**, **`NEXT_PUBLIC_API_URL=http://localhost:3000`** (or empty) so `/api` is **proxied** to Express on 5000 via **`next.config.ts`**. Set **`MONGODB_URI`** and optionally **`MONGODB_URI_DIRECT`** (non-SRV, used when set) in **`apps/api/.env`**
- **DB / jobs:** MongoDB + Mongoose; **standup** via **OpenAI**; **GitHub** + **Slack** OAuth; **`node-cron`**: `fetchActivity` (hourly), `generateStandup` (15m, auto-draft + optional Slack DM)
- **API secrets:** `apps/api/.env` — **`OPENAI_*`**, optional **`GITHUB_*`**, **`SLACK_CLIENT_ID` / `SLACK_CLIENT_SECRET`**, **`API_PUBLIC_URL`**

## Must-read files

| File | Purpose |
|------|--------|
| **`DESIGN.md`** | **Canonical UI/brand** (Claude-inspired: parchment, terracotta, warm neutrals, type, components). **Read before any UI work.** |
| **`IMPLEMENTATION_PLAN.md`** | **Build phases**, API shape, and folder layout. |
| **`.cursor/rules/*.mdc`** | Cursor project rules (design + plan). |

## Cursor / IDE (industry-typical setup)

- **`.cursor/rules/`** — Rules with optional `globs` and `alwaysApply` so the agent applies project conventions automatically.
- This **`AGENTS.md`** — Short context for **any** coding agent (Cursor, Copilot, Claude Code, etc.). Keep it under ~200 lines; link to longer docs.
- Do **not** commit secrets. Use **`.env.local`** (web) and **`apps/api/.env`** (API) per plan examples.

## Next.js in this project

`CLAUDE.md` / upstream notes may say this Next version differs from older training data — **prefer the project’s `package.json` and `node_modules/next` docs** over outdated patterns.

## UI implementation note

`app/globals.css` holds **theme tokens** aligned with `DESIGN.md`. Prefer Tailwind classes backed by those tokens (e.g. `bg-parchment`, `text-near-black`) over raw hex in JSX.
