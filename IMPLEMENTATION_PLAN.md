# StandupBot — Implementation Plan

Single source of truth for building the product **in order**, with clear acceptance criteria per phase.  
**Stack (locked for v1):** Node 20+ · Express · MongoDB (Mongoose) · Next.js 14 (App Router) · Tailwind · shadcn/ui · Zustand · Axios · Anthropic (Claude) · JWT auth · `node-cron` (Bull/Redis **later** if needed)

### Design system (UI consistency)

- **Canonical reference:** [DESIGN.md](./DESIGN.md) in the **repo root** (Claude-inspired system from [getdesign](https://getdesign.md); warm parchment palette, terracotta CTA, serif/sans hierarchy, ring shadows, editorial spacing).  
- **Rule:** All **frontend** work (`apps/web`) must align with **DESIGN.md** — colors, typography roles, component treatments (buttons, cards, inputs, nav), layout spacing, and do’s/don’ts. Deviations need an explicit product reason and should update **DESIGN.md** if the pattern becomes the new default.  
- **Implementation:** In **Phase 3**, when Tailwind and shadcn are added, **map** DESIGN.md tokens to `tailwind.config` (CSS variables or theme extension: parchment, terracotta, near-black, borders, radii) so day-to-day styling stays consistent.  
- **Re-install / refresh the template:** from repo root, run: `npx getdesign@latest add claude` (overwrites **DESIGN.md** — back up if you’ve customized it).

---

## 0. Pre-flight (before any code)

| Item | Action |
|------|--------|
| Scope | MVP: **GitHub + Slack + web**; **no** Jira, **no** VS Code extension, **no** Bull until needed |
| “Day” rule | Document: standup/activity “today” = **user’s local calendar day**; store UTC range in DB; one sentence in this doc (§1) |
| Dev URLs | e.g. API `http://localhost:5000`, Web `http://localhost:3000` — all OAuth redirect URIs and `NEXT_PUBLIC_API_URL` must match |
| Accounts | MongoDB (local/Atlas) · Anthropic key · GitHub OAuth app · Slack app (redirect URLs) |
| UI | Read **DESIGN.md**; plan Tailwind token mapping in Phase 3 |

**Day rule (v1):** For each user, `date` = `YYYY-MM-DD` in `user.timezone`. Query activities with `timestamp` in `[localStartUtc, localEndUtc)` for that calendar day.

---

## 1. System design (frozen for implementation)

```text
[ Browser: Next.js ] --HTTPS--> [ Express API ] --Mongoose--> [ MongoDB ]
                                      |
                    +-----------------+-----------------+
                    v                 v                 v
              [ GitHub API ]   [ Slack API ]     [ Anthropic API ]
```

- **Cron** runs in the **same Node process** as the API (or a second entry file that `import`s the same `services/*`).  
- **Never** duplicate business logic: HTTP handlers and jobs call **services** only.  
- **Idempotent activity writes:** dedup key = stable hash of `(userId, source, type, url, dateBucket)` + unique index.

---

## 2. API conventions (apply from Phase 2 on)

- **Base:** `/api/...`  
- **Auth:** `Authorization: Bearer <accessToken>` on protected routes  
- **Success:** normal JSON; **no** 200 with `error` in body for failures  
- **Errors:** `{ "error": { "code": "STRING", "message": "..." } }` + correct status: 400/401/403/404/422/500  
- **Validation:** `express-validator` or `zod` on body/query; **422** for invalid input  
- **Secrets:** never return OAuth tokens or `passwordHash`

---

## 3. Folder structure (target monorepo)

```text
standupbot/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── config/          # db.js, env.js (zod validate on boot)
│   │   │   ├── models/          # User, Activity, Standup, Integration
│   │   │   ├── routes/
│   │   │   ├── controllers/
│   │   │   ├── services/        # github, slack, claude, aggregator
│   │   │   ├── jobs/            # fetchActivity, generateStandup
│   │   │   ├── middleware/      # auth, error, asyncHandler
│   │   │   └── app.js
│   │   ├── package.json
│   │   └── .env.example
│   └── web/
│       ├── app/                 # App Router: (auth), dashboard, standup, settings, history
│       ├── components/
│       ├── lib/                 # apiClient, zustand stores, date helpers
│       ├── package.json
│       └── .env.local.example
├── package.json                 # optional: workspaces + npm scripts
├── DESIGN.md                    # canonical UI + brand reference (getdesign: claude)
├── AGENTS.md                    # short context for agents + link to rules
├── .cursor/rules/*.mdc          # Cursor: design + plan (always-apply)
├── IMPLEMENTATION_PLAN.md       # this file
└── README.md                    # how to run (add in Phase 1)
```

---

## 4. Implementation phases (execute in order)

### Phase 1 — Repo + API shell + health

| Step | Task | Done when |
|------|------|-----------|
| 1.1 | Root + `apps/api` + `apps/web` packages, `dotenv`, Node 20 | `package.json` scripts work |
| 1.2 | `config/env.js` **zod** validate: `PORT`, `MONGODB_URI`, `JWT_SECRET` | Process exits on bad env at boot |
| 1.3 | `config/db.js` Mongoose connect | `/health` returns 200, DB ok |
| 1.4 | `middleware/error.js` + `asyncHandler` (wrap async routes) | No unhandled async errors in routes |
| 1.5 | CORS for web origin, `helmet` optional | Browser can call API from dev port |

**Exit:** `GET /health` works; bad `.env` fails at startup with clear message.

---

### Phase 2 — Auth + User model

| Step | Task | Done when |
|------|------|-----------|
| 2.1 | `User` model: email, passwordHash, timezone, `standupTime`, timestamps | Migrations N/A; indexes on `email` unique |
| 2.2 | `POST /api/auth/register`, `POST /api/auth/login` | Returns JWT; validate body |
| 2.3 | `auth.middleware` JWT verify | 401 if missing/invalid |
| 2.4 | `GET /api/user/me` protected | Returns safe user (no password, no tokens) |

**Exit:** Postman or curl: register → login → `me` with token.

---

### Phase 3 — Web: auth + API client (walking skeleton)

| Step | Task | Done when |
|------|------|-----------|
| 3.1 | Next 14, Tailwind, shadcn base, **theme from DESIGN.md** (parchment background, terracotta primary, warm neutrals, font stacks: Georgia + `system-ui`/`Inter` as stand-ins per DESIGN.md), `lib/api.ts` Axios + baseURL from env | |
| 3.2 | Interceptor: attach Bearer; on **401** clear auth + redirect login | No silent 401 loop |
| 3.3 | Pages: login, register, optional layout | |
| 3.4 | After login, dashboard shows **“Hello” + /me** data | **End-to-end auth in browser** |

**Exit:** Full path: sign up → sign in → see profile from API (CORS + JWT OK).

---

### Phase 4 — Activity + manual CRUD

| Step | Task | Done when |
|------|------|-----------|
| 4.1 | `Activity` model + **dedup** field/index | Unique `(userId, dedupKey)` or equivalent |
| 4.2 | `GET /api/activity/today` (and `?date=`) | Scoped to `req.user` |
| 4.3 | `POST /api/activity` (manual), `DELETE /api/activity/:id` | Validated; owner-only |

**Exit:** Create activity in UI or API; list “today” correctly in user TZ (helper tested).

---

### Phase 5 — Standup + Claude (no GitHub yet)

| Step | Task | Done when |
|------|------|-----------|
| 5.1 | `services/claude.service.js` — system+user prompt from spec | Returns yesterday/today/blockers (markdown or small JSON) |
| 5.2 | `Standup` model: userId, date, sections, `editedContent`, `status` | |
| 5.3 | `POST /api/standup/generate` — aggregate today’s activities → Claude → upsert **draft** | |
| 5.4 | `GET /api/standup/today`, `PUT /api/standup/:id` | User can edit `editedContent` |
| 5.5 | Web: **Standup** page — load draft, edit, save | |

**Exit:** With **manual** activities, generate a standup, edit, persist.

---

### Phase 6 — GitHub integration + fetch job

| Step | Task | Done when |
|------|------|-----------|
| 6.1 | `Integration` model (platform, encrypted tokens, meta) | Never expose raw tokens in JSON |
| 6.2 | GitHub OAuth: callback routes, store tokens, `GET/DELETE /api/integrations` | |
| 6.3 | `services/github.service` — commits/PRs for connected user | Map → `Activity` with dedup |
| 6.4 | `jobs/fetchActivity` — `node-cron` hourly, per user with GitHub | Errors logged; one user fail doesn’t kill all |

**Exit:** Connect GitHub; after fetch, new activities appear; standup can include them.

---

### Phase 7 — Slack + send

| Step | Task | Done when |
|------|------|-----------|
| 7.1 | Slack OAuth + `slack.service` post message (channel or DM) | Scopes decided and documented in README |
| 7.2 | `POST /api/standup/:id/send` | Uses `editedContent` or default sections; record `sentAt`, `status` |
| 7.3 | `jobs/generateStandup` — e.g. every 15 min, users at `standupTime` in TZ | Creates draft; optional Slack **DM** to review |

**Exit:** One button sends standup to Slack; optional auto-draft at standup time.

---

### Phase 8 — Remaining UI + polish

| Step | Task | Done when |
|------|------|-----------|
| 8.1 | Dashboard: activity feed (grouped by source) | |
| 8.2 | Settings: integration cards, disconnect, timezone, standup time | |
| 8.3 | History: **paginated list** of past standups (calendar optional later) | |

**Exit:** MVP workflow complete for a real user.

---

### Phase 9 — Tests

| Step | Task | Done when |
|------|------|-----------|
| 9.1 | **Unit** (Jest/Node test): date boundaries, dedup, claude parse | CI-ready |
| 9.2 | **API integration** (supertest + in-memory Mongo or test DB): auth, activity, standup | |
| 9.3 | **Playwright** (E2E): register/login → dashboard; optional happy path generate standup (use test env / seeded user) | `playwright.config` starts or assumes URLs |

**Exit:** `npm test` and `npx playwright test` pass locally.

---

## 5. Focus rules (to avoid thrash)

1. **Finish a phase** before starting the next (small exceptions: stub routes behind feature flags only if needed).  
2. **One PR / commit theme** per phase chunk when using git.  
3. **No new integrations** (Jira, extension) until Phase 8 exit criteria are met.  
4. **Redis/Bull** only when hourly job duration or failure handling requires a queue.  
5. Re-read **§0** and **§1** if standup/activity “today” ever feels wrong.  
6. **UI:** Follow **DESIGN.md**; extend Tailwind/shadcn with those tokens in Phase 3 so new screens do not introduce one-off grays or off-brand colors.

---

## 6. Next action

Start with **Phase 1** (§4): scaffold monorepo, env validation, Mongo, health route, error middleware, CORS.

When Phase 1 is done, mark it in a tracker (issue checklist) and move to **Phase 2**.

---

*Last updated: implementation kickoff. Adjust dates or URLs only in §0/§2 as the project matures.*
