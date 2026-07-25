# benchlee

**Show your work.**

The AI benchmarks you can actually see and judge for yourself.

Every LLM leaderboard compresses a model's work into one number and asks you to
trust the compression. For subjective work — layout, taste, restraint — that
number throws away exactly the part you cared about. Benchlee stores what each
model **actually built** and renders it live, side by side, in a sandboxed frame.
Scores are still here; they just sit underneath the evidence instead of standing
in for it.

---

## Quick start

```bash
docker compose up
```

Open <http://localhost:3000>. That is the whole setup — the web container waits
for Postgres, applies migrations, seeds the benchmark data, and starts the app.
Every step is idempotent, so restarting is always safe.

| | |
|---|---|
| App | <http://localhost:3000> |
| Postgres | `postgres://benchlee:benchlee@localhost:5432/benchlee` |
| Health | <http://localhost:3000/api/health> |

Override ports with `BENCHLEE_WEB_PORT` / `BENCHLEE_DB_PORT`. Set
`BENCHLEE_AUTO_SEED=0` to skip the seed on boot.

### Local development

```bash
docker compose up -d db     # Postgres only
cp .env.example .env
pnpm install
pnpm db:migrate && pnpm db:seed
pnpm dev
```

---

## What's in here

| Route | What it does |
|---|---|
| `/` | The pitch, plus a live three-way artifact comparison |
| `/tasks` | Every benchmark, with a strip of each model's answer |
| `/tasks/[slug]` | **The gallery** — every model's artifact for one brief, rendered side by side |
| `/arena` | **Blind head-to-head.** Two artifacts, no labels. Vote, then the names appear |
| `/compare` | Labelled split view of any two entries, plus the numbers |
| `/leaderboard` | Standings, ranked by blind win rate |
| `/models`, `/models/[slug]` | Model directory and per-model portfolio |
| `/a/[id]` | One artifact, full size and interactive, with its source |
| `/methodology` | How it works and what it refuses to claim |
| `/api/artifacts/[id]/raw` | Artifact source, served for the sandboxed iframe |
| `/api/vote` | Records a head-to-head ballot |
| `/api/health` | Compose healthcheck (fails if Postgres is down) |

Dynamic OG images are generated per benchmark, model and artifact, so every
permalink previews as its own share card.

---

## Architecture

```
compose.yaml ──┬── db    postgres:17-alpine, volume-backed
               └── web   Next.js 16 standalone
                          └─ entrypoint: wait → migrate → seed → serve
```

- **Next.js 16** (App Router, React 19, Tailwind v4), `output: "standalone"`.
- **Postgres 17** via `pg`. No ORM — plain SQL migrations and a typed query layer
  in `src/lib/queries.ts`.
- **Ops scripts are plain `.mjs`** (`scripts/`) so they run inside the slim
  production image, which has no TypeScript toolchain.

```
db/migrations/       forward-only SQL, applied once, tracked in schema_migrations
db/seed/catalog.json models, tasks, run telemetry, editorial scores and ballots
db/seed/artifacts/   <task-slug>/<model-slug>.html — the artifacts themselves
scripts/             migrate · seed · wait-for-db · run-benchmark
src/lib/             db client, queries, types, brand constants, OG primitives
src/components/      ArtifactFrame (the core), ArtifactCard, ArenaBoard, ui
src/app/             routes
```

### Data model

`models` and `tasks` are the catalog. A `run` is one model's attempt at one task
and carries the telemetry; the `artifact` hanging off it is the actual file.
`scores` are a leaf table off a run, and `votes` records head-to-head ballots.
The `model_standings` view rolls votes and rubric averages up per model — as
**two separate columns**, never blended into one composite.

The ordering is deliberate: an artifact can exist without a score, but a score
can never exist without an artifact to point at.

### How artifacts are rendered safely

Artifact HTML is untrusted model output, so two independent guards apply:

1. The iframe is sandboxed **without** `allow-same-origin`, giving artifact code
   an opaque origin with no access to Benchlee's DOM, cookies or storage.
2. `/api/artifacts/[id]/raw` sends `Content-Security-Policy: default-src 'none'`
   with only inline styles and scripts allowed — so an artifact cannot fetch,
   beacon, load a remote font, or embed anything.

`ArtifactFrame` lays the iframe out at the task's authored viewport (e.g.
1280×860) and scales it to the card width, so every model is judged at the same
viewport instead of at whatever the grid happens to be.

---

## Where the data comes from

**This repo ships a demo dataset.** The 20 artifacts under `db/seed/artifacts/`
are hand-authored fixtures that exist so a fresh install has something to show.
They are **not** transcripts of real provider calls. Every one is stored with
`provenance = 'demo'` and rendered behind a **Demo** badge, and `/methodology`
says so on the page.

The seeded head-to-head ballots carry a `seed:editorial:*` voter key so the
leaderboard has a shape on first boot. `/leaderboard` reports community votes
(real visitor ballots, `v:*` keys) as a separate figure.

### Publishing real runs

```bash
export ANTHROPIC_API_KEY=...   # and/or OPENAI_API_KEY, GOOGLE_API_KEY
pnpm bench:run --dry-run       # show what would run, call nothing
pnpm bench:run                 # every wired model x every task
pnpm bench:run --task css-clock --model claude-opus-5
```

`scripts/run-benchmark.mjs` calls the provider APIs directly, stores the returned
file verbatim, and records real latency and token counts as
`provenance = 'live'` — which renders without the Demo badge. **It never
fabricates a result**: a provider with no API key, or a model with no entry in
`db/seed/models.runtime.json`, is skipped and reported, not filled in.

`db/seed/models.runtime.json` maps a catalog slug to the concrete API model id
and its pricing. The ids and prices in it are **examples** — point them at models
your account has and check current pricing before trusting `cost_usd`.

---

## Extending the suite

Add a model or a benchmark in `db/seed/catalog.json`, drop matching files under
`db/seed/artifacts/<task-slug>/<model-slug>.html`, and re-seed:

```bash
pnpm db:seed        # idempotent: upserts catalog, replaces demo runs
pnpm db:reset       # drop everything and rebuild from scratch
```

The schema, not the fixtures, is the product. The four shipped briefs
(pricing page, hand-authored SVG chart, CSS-only clock, 404 page) are chosen
because each produces something renderable and each has a way to fail that a
pass/fail test would shrug at — but they are meant to be replaced.

---

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Dev server on :3000 |
| `pnpm build` | Production build (standalone output) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm db:migrate` | Apply pending migrations |
| `pnpm db:seed` | Seed / re-seed the demo dataset |
| `pnpm db:reset` | Drop schema, migrate, seed |
| `pnpm bench:run` | Run live benchmarks against provider APIs |

---

## What this benchmark is bad at

It does not measure reasoning, long-context recall, tool use, factual accuracy,
safety, or anything multi-turn. It is four front-end briefs, one generation per
model per task, at non-zero temperature. A model that wins here is good at these
four things. Treat single entries as anecdotes and the aggregate as weak
evidence — `/methodology` says the same thing to visitors.
