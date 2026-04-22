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

- GitHub integration
- Slack integration and send flow
- Background jobs for scheduled fetching and draft generation
- Standup history and settings polish

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

Activity:

- `GET /api/activity/today`
- `GET /api/activity?date=YYYY-MM-DD`
- `POST /api/activity`
- `DELETE /api/activity/:id`

Standup:

- `GET /api/standup/today`
- `POST /api/standup/generate`
- `PUT /api/standup/:id`

## Important Project Docs

- `DESIGN.md`: canonical UI and brand system
- `IMPLEMENTATION_PLAN.md`: implementation phases, architecture, and API shape
- `AGENTS.md`: coding agent context for this repo
- `.cursor/rules/*.mdc`: project rules used by Cursor

## Notes

- `today` is based on the user's local calendar day, not just server time
- Standup generation currently depends on manual activity entries unless you add the upcoming integrations
- GitHub and Slack are product goals in this repo, but their integrations are not fully implemented yet

## Suggested GitHub Description

AI-assisted daily standup drafts for developers, built with Next.js, Express, MongoDB, and OpenAI.
