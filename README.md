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

**Web + API (recommended for local dev)**

From the repo root, one terminal:

```bash
pnpm install
pnpm run dev:all
```

This starts **Next** on [http://localhost:3000](http://localhost:3000) and the **Express API** on port **5000** (so the `/api` proxy works). You still need **`apps/api/.env`** (copy from `apps/api/.env.example`) with `MONGODB_URI`, `JWT_SECRET`, and MongoDB running or Atlas reachable.

**Or run them separately:** `pnpm run dev` in one terminal and `pnpm run dev:api` in another.

**API only**

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
- Standup (auth): `GET /api/standup/today` · `POST /api/standup/generate` · `PUT /api/standup/:id` — drafts use **OpenAI** (`OPENAI_API_KEY` + optional `OPENAI_MODEL` in **`apps/api/.env`**).

**Frontend env**

Copy **`.env.local.example`** → **`.env.local`**. In local dev, set **`NEXT_PUBLIC_API_URL=http://localhost:3000`** (same as the Next app) or leave it empty for same-origin requests. The dev server **proxies** **`/api/*`** to Express on **5000** (override with **`API_PROXY_TARGET`** if needed). That way the **browser** only uses port **3000** and you avoid `ERR_CONNECTION_REFUSED` to **5000** when the app was misconfigured. Run **`pnpm run dev:api`** so Express listens (default **`PORT=5000`** in **`apps/api/.env`**). You can also set **`NEXT_PUBLIC_API_URL=http://localhost:5000`** to call the API port directly, without the proxy. Then **register** or **log in**; the **dashboard** uses **`/api/user/me`**.

**Sign-in tip:** `email` is stored **lowercased**; the API now **normalizes** login/register the same way.

### MongoDB / Atlas

Set **`MONGODB_URI`** in **`apps/api/.env`**. If **`querySrv` / SRV** fails on your network, paste Atlas’s **standard** (non-srv) string into **`MONGODB_URI_DIRECT`** — the API will use that and skip SRV. If the first DB connection fails, the server still starts and **retries every 10s**; `/api` may return **503** until the DB is reachable.

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
| `pnpm run dev:all` | Next + Express together (use this so port 5000 is up for `/api` proxy) |
| `pnpm run build` | Production build (Next) |
| `pnpm run lint` | ESLint |

## Learn more

- [Next.js Documentation](https://nextjs.org/docs)
