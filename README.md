# StandupBot

StandupBot is a developer productivity app for turning real work into clean daily standup drafts. The long-term product pulls activity from tools like GitHub and Slack, groups it by your local workday, drafts a structured update with OpenAI, and lets you edit before sharing.

The current repo already includes the core web and API foundation: authentication, manual activity tracking, and AI-generated standup drafts.

## Description

Draft better daily standups from real developer activity. StandupBot combines tracked work, local-day grouping, and AI-assisted drafting so updates are faster to prepare and easier to review before sending.

## Current Status

Implemented today:

- Next.js web app at the repo root
- Express API in `apps/api`
- JWT auth with register, login, and profile fetch
- Manual activity CRUD scoped to the signed-in user
- Timezone-aware "today" activity queries
- OpenAI-powered standup draft generation and editing
- Warm Claude-inspired UI system defined in `DESIGN.md`

Planned next:

- Automated tests (Phase 9), richer Slack channel UX, analytics

Done recently:

- GitHub + Slack integrations; activity feed **by source**; **Settings** profile (timezone, standup time); **History** pagination; **PATCH /user/me**; **GET /standup/history**

## Repo Layout

This repo intentionally uses both `app/` and `apps/`:

- `app/`: Next.js App Router pages and layouts for the web client
- `components/`, `lib/`, `types/`: shared frontend code at the repo root
- `apps/api/`: Express backend, models, services, routes, and controllers

## Stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Zustand, Axios
- Backend: Express, Mongoose, JWT, Zod
- Database: MongoDB
- AI: OpenAI Chat Completions
- Workspace: pnpm monorepo

## How It Works

1. A user signs up and logs in.
2. Activity is stored against that user and grouped by their local calendar day.
3. The API sends today's activity to OpenAI.
4. StandupBot returns a draft split into structured standup sections.
5. The user edits the draft and saves it.

## Local Development

### Prerequisites

- Node.js 20+
- pnpm
- MongoDB running locally or an Atlas connection string
- OpenAI API key for standup generation

### Install

```bash
pnpm install
```

### Environment Variables

Frontend:

1. Copy `.env.local.example` to `.env.local`
2. For local development, keep `NEXT_PUBLIC_API_URL=http://localhost:3000` or leave it empty for same-origin requests

Backend:

1. Copy `apps/api/.env.example` to `apps/api/.env`
2. Set:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `WEB_ORIGIN=http://localhost:3000`
   - `OPENAI_API_KEY`
3. Optionally set:
   - `MONGODB_URI_DIRECT` if SRV resolution fails
   - `OPENAI_MODEL` to override the default `gpt-4o-mini`
   - `API_PUBLIC_URL` (default `http://localhost:5000`) — must match the URLs you register in GitHub and Slack
   - `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` — **Connect GitHub**; callback: `${API_PUBLIC_URL}/api/integrations/github/callback`
   - `SLACK_CLIENT_ID` and `SLACK_CLIENT_SECRET` — **Connect Slack**; redirect URL: `${API_PUBLIC_URL}/api/integrations/slack/callback` — in the Slack app, set **Bot token scopes** to `chat:write`, `im:write`, and `users:read`

## Run The Project

Run web and API together:

```bash
pnpm run dev:all
```

This starts:

- Next.js on `http://localhost:3000`
- Express API on `http://localhost:5000`

The Next dev server proxies `/api/*` to the API server on port `5000`.

Run separately if needed:

```bash
pnpm run dev
pnpm run dev:api
```

## Scripts

- `pnpm run dev`: start the Next.js app
- `pnpm run dev:api`: start the Express API workspace
- `pnpm run dev:all`: run web and API together
- `pnpm run build`: build the Next.js app
- `pnpm run start`: start the built Next.js app
- `pnpm run lint`: run ESLint

## API Overview

Health:

- `GET /health`

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/user/me`
- `PATCH /api/user/me` — `name?`, `timezone?` (IANA, e.g. `Europe/Paris`), `standupTime?` (`HH:mm`)

Activity:

- `GET /api/activity/today`
- `GET /api/activity?date=YYYY-MM-DD`
- `POST /api/activity`
- `DELETE /api/activity/:id`

Standup:

- `GET /api/standup/today`
- `GET /api/standup/history?limit=20&before=YYYY-MM-DD` — older pages: pass `before` = `nextBeforeDate` from the previous response
- `POST /api/standup/generate`
- `POST /api/standup/:id/send` — body optional `{ "channel": "C…" }` (otherwise DM the connected user)
- `PUT /api/standup/:id`

Integrations (auth):

- `GET /api/integrations` — list (no token secrets in JSON)
- `GET /api/integrations/github/authorize` — returns `{ "url" }` for the browser
- `GET /api/integrations/github/callback` — OAuth redirect (not from axios)
- `POST /api/integrations/github/sync` — pull latest GitHub events into activity
- `DELETE /api/integrations/:id` — disconnect

## Important Project Docs

- `DESIGN.md`: canonical UI and brand system
- `IMPLEMENTATION_PLAN.md`: implementation phases, architecture, and API shape
- `AGENTS.md`: coding agent context for this repo
- `.cursor/rules/*.mdc`: project rules used by Cursor

## Notes

- `today` is based on the user's local calendar day, not just server time
- With GitHub connected, recent events are also ingested (hourly; use **Sync now** in Settings to force)
- Slack send is not implemented yet; see `IMPLEMENTATION_PLAN.md` Phase 7

## Suggested GitHub Description

AI-assisted daily standup drafts for developers, built with Next.js, Express, MongoDB, and OpenAI.
