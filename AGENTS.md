# AGENTS.md — conventions for working in Benchlee

Read `CONTEXT.md` first for vocabulary. This file is about how to change things.

## The one rule

**The artifact outranks the number.** Any UI that shows a score must put the
artifact above it or one click away, and any score must be traceable to the run
that produced it. If you find yourself adding a composite metric that blends
votes with rubric scores, stop — that is explicitly rejected in `CONTEXT.md`.

## Honesty constraints (do not route around these)

- Never write a row with `provenance = 'live'` from anything but a real provider
  response. `scripts/run-benchmark.mjs` skips and reports instead of guessing.
- Never remove or weaken the **Demo** badge on seeded data, the demo notice on
  `/methodology`, or the demo section in the README. If you add fixtures, they
  are `demo`.
- Seeded ballots keep the `seed:` voter-key prefix so `/leaderboard` can report
  community turnout separately.
- `/methodology` states what the benchmark cannot measure. Keep it accurate as
  the suite changes.

## Stack facts worth knowing before you edit

- **Next.js 16 App Router.** `params` and `searchParams` are Promises — `await`
  them. Route handlers take `{ params }: { params: Promise<{...}> }`.
- Every database-backed route sets `export const dynamic = "force-dynamic"`.
  The build must never need a live database.
- **`eslint-config-next` 16 ships flat configs directly.** Import
  `eslint-config-next/core-web-vitals` and `/typescript` — do not reintroduce
  `FlatCompat`, it throws a circular-structure error on this version.
- **Tailwind v4.** Design tokens are declared in `@theme` in
  `src/app/globals.css`, not in a `tailwind.config`.
- **`packageManager` is pinned in `package.json`.** Recent pnpm releases enforce
  a minimum-release-age policy that rejects freshly published transitive deps;
  the pin is what keeps `docker compose build` reproducible.

## Scripts are `.mjs`, and that's deliberate

`scripts/*.mjs` run inside the production image, which contains only the
standalone server and its traced dependencies — no TypeScript toolchain. Keep
them plain ESM JavaScript importing nothing but `node:*` and `pg`. Application
code stays TypeScript under `src/`.

## Database changes

- Migrations are **forward-only** and applied once, tracked in
  `schema_migrations`. Add a new numbered file in `db/migrations/`; never edit an
  applied one.
- Every migration must be safe to re-run against an existing database
  (`CREATE TABLE IF NOT EXISTS`, `CREATE OR REPLACE VIEW`), because the container
  entrypoint runs `migrate` on every boot.
- The seed is idempotent: catalog rows upsert by slug, and demo runs for a
  (task, model) pair are deleted and rewritten. `live` runs are never touched by
  the seed.
- Read through `src/lib/queries.ts`. Pages should not build SQL or import `pg`.

## Rendering untrusted artifacts

Artifact HTML is model output and is treated as hostile:

1. `<iframe sandbox="allow-scripts">` — **never** add `allow-same-origin`. That
   combination would give artifact code access to Benchlee's origin.
2. `/api/artifacts/[id]/raw` sends `default-src 'none'` so artifacts cannot make
   network requests.

Both guards are independent on purpose. If you touch either, keep both.

## Adding a model or a benchmark

1. Add the entry to `db/seed/catalog.json`.
2. Add `db/seed/artifacts/<task-slug>/<model-slug>.html` for every pair — the
   seed warns and skips a run with no artifact file rather than inventing one.
3. Add its `runs` entry (telemetry + editorial scores) in the same file.
4. `pnpm db:seed`.

For a live model, also wire it in `db/seed/models.runtime.json`.

## Before you open a PR

```bash
pnpm typecheck && pnpm lint && pnpm build
docker compose down -v && docker compose up -d   # must come up clean, no manual steps
curl -s localhost:3000/api/health
```

`pnpm build` is not optional when you touch a `"use client"` file or add an
import into one — `typecheck` and `lint` never run `next build`, so a client
chunk pulling in a server-only value passes both and still breaks the build.
`src/lib/queries.ts` imports `server-only` specifically to make that failure
loud.
