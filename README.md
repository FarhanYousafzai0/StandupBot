# StandupBot

Developer productivity app: **daily standup drafts** from real work (GitHub, Slack, etc.). See **`IMPLEMENTATION_PLAN.md`**.

## Folder layout

The repo can look like there are “two app folders,” but they mean different things: **`app/`** (singular) is **Next.js’s required App Router** directory for pages, layouts, and route groups for the **web client** (do not rename it — that is the framework convention). **`apps/`** (plural) is the **monorepo** convention for **separate deployable projects**; here it holds **`apps/api`**, the **Express** backend. The Next app also lives with its `package.json` at the **repo root**; only the API is nested under `apps/`. If we ever want perfect symmetry, we could move the web app to `apps/web` — for now this layout is intentional and valid.

| Path | Role |
|------|------|
| **`app/`** | Next.js routes & UI (App Router) |
| **`apps/api/`** | Express API, Mongoose, auth routes |
| **`components/`, `lib/`** | Shared frontend code at repo root |

## Quick start

This monorepo uses **pnpm** (`pnpm-workspace.yaml`). Install from the repo root:

```bash
pnpm install
```

**Web (Next.js)**

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**API (Express)**

1. Copy **`apps/api/.env.example`** → **`apps/api/.env`**, set `MONGODB_URI` and `JWT_SECRET` (8+ characters).
2. Start MongoDB locally (or use Atlas) so `MONGODB_URI` is reachable.
3. From repo root:

```bash
pnpm run dev:api
```

- Health: [http://localhost:5000/health](http://localhost:5000/health)
- Auth: `POST /api/auth/register`, `POST /api/auth/login` — response includes `token` (JWT, 7d).
- Me: `GET /api/user/me` with header `Authorization: Bearer <token>`.
- Activity (auth): `GET /api/activity/today` · `GET /api/activity?date=YYYY-MM-DD` · `POST /api/activity` · `DELETE /api/activity/:id` — “today” is the user’s **timezone** from their profile; dedupe by **source + URL + day** (manual entries use **title** when URL is empty).

**Frontend env**

Copy **`.env.local.example`** → **`.env.local`** and set **`NEXT_PUBLIC_API_URL=http://localhost:5000`** (no trailing slash) with the API running. Then **register** or **log in** at `/register` and `/login`; the **dashboard** calls **`/api/user/me`** with the stored JWT.

## Design & agent context

| Doc | Purpose |
|-----|--------|
| **`DESIGN.md`** | UI/brand system (warm parchment, terracotta, typography) — **read before building UI** |
| **`IMPLEMENTATION_PLAN.md`** | Phased build order and API conventions |
| **`AGENTS.md`** | Short context for coding agents (Cursor, Copilot, Claude Code) |
| **`.cursor/rules/*.mdc`** | **Cursor Rules** — design + plan (industry-standard for this repo) |

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm run dev` | Next.js dev server |
| `pnpm run dev:api` | Express API (workspace `api`; port from `PORT`, default 5000) |
| `pnpm run build` | Production build (Next) |
| `pnpm run lint` | ESLint |

## Learn more

- [Next.js Documentation](https://nextjs.org/docs)
