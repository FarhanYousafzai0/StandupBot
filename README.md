# StandupBot

Developer productivity app: **daily standup drafts** from real work (GitHub, Slack, etc.). See **`IMPLEMENTATION_PLAN.md`**.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Copy **`.env.local.example`** → **`.env.local`** and set **`NEXT_PUBLIC_API_URL`** when the Express API is running (e.g. `http://localhost:5000`).

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
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |

## Learn more

- [Next.js Documentation](https://nextjs.org/docs)
