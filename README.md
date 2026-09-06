# benchlee

**Show your work.**

A read-only gallery of model outputs, with side-by-side comparisons and traceable
editorial scores. Original artifacts stay unchanged; Demo fixtures stay labelled.

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
| `/` | Featured outputs and benchmark gallery |
| `/tasks` | Every benchmark, with a strip of each model's answer |
| `/tasks/[slug]` | **The gallery** — every model's artifact for one brief, rendered side by side |
| `/arena` | Redirects to labelled comparison; voting is retired |
| `/compare` | Labelled split view of any two entries, plus the numbers |
| `/leaderboard` | Historical standings; editorial scores shown separately |
| `/models`, `/models/[slug]` | Model directory and per-model portfolio |
| `/a/[id]` | One artifact, full size and interactive, with its source |
| `/methodology` | How it works and what it refuses to claim |
| `/api/artifacts/[id]/raw` | Artifact source, served for the sandboxed iframe |
| `/api/vote`, `/api/benchmark` | HTTP 410; public submissions are retired |
| `/benchmark` | Redirects to benchmarks |
| `/benchmark/[id]` | Saved custom output, telemetry, prompt, and source |
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
src/components/      ArtifactFrame (the core), ArtifactCard, BenchmarkResult, ui
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

### Saved custom results

Previously saved custom results remain accessible at `/benchmark/[id]`, with
original prompts, raw source, provider effort labels, latency, and token counts.
They stay separate from curated standings and are untouched by seeding.

The public site is read-only: `/benchmark` redirects to `/tasks`, and POST requests
to `/api/benchmark` and `/api/vote` return HTTP 410 even when credentials are set.
No provider call or database write is made. Use `pnpm bench:run` to publish curated
results as an operator. Historical vote records remain available; voting is closed.

Ticket acceptance checks: `node --test --import ./tests/register.mjs tests/readonly.test.mjs`.

For responsive acceptance, start an isolated preview (no database or provider calls):

```bash
NODE_OPTIONS="--import ./tests/fixtures/readonly.mjs" pnpm exec next dev -p 3017
# In another terminal, with Playwright and Chromium available:
node tests/readonly-browser.mjs
```

Set `PLAYWRIGHT_MODULE` to the Playwright module path if installed externally,
and `BENCHLEE_PREVIEW_URL` to override the preview URL. This fixture startup is
for verification only; normal development and deployment still use Postgres.
