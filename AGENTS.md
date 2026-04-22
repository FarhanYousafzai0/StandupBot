# StandupBot — agent context

## Product

Developer productivity app: **daily standup drafts** from tracked activity (GitHub, Slack, etc.). See **`IMPLEMENTATION_PLAN.md`**.

## Stack (this repo)

- **Frontend:** Next.js (App Router) at **repo root** — `app/`, `components/`, `lib/`
- **Backend:** Express API will live at **`apps/api/`** per plan (when present); set **`NEXT_PUBLIC_API_URL`** in `.env.local` to match
- **DB / jobs:** MongoDB, Mongoose, `node-cron` (as in plan)

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
