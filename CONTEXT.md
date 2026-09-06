# CONTEXT.md — Benchlee vocabulary

The words this codebase uses, and what they mean here specifically. When a term
below appears in a variable, table, route or PR description, it means *this*.

## Core nouns

**Artifact** — the file a model produced for a task, stored verbatim. This is the
unit of truth in Benchlee. Everything else exists to give an artifact provenance
or to help you compare it. Table: `artifacts`. An artifact is never edited,
prettified, or repaired; if a model shipped broken markup, the broken markup is
what we store and render.

**Run** — one model's attempt at one task. Carries the telemetry (latency, token
counts, cost, temperature) and the `provenance`. Table: `runs`. A run exists to
qualify an artifact; a (task, model) pair can be re-run, and the site shows the
newest run.

**Task** — a benchmark brief: a single prompt string plus the viewport its output
is judged at and the rubric dimensions it is scored on. Table: `tasks`. Called a
"benchmark" in user-facing copy, `task` in code and URLs (`/tasks/[slug]`).

**Model** — a catalog entry for an LLM: display name, vendor, accent colour,
badge. Table: `models`. Deliberately decoupled from the concrete API model id,
which lives in `db/seed/models.runtime.json` — one catalog entry can be pointed
at whatever model id an account actually has.

**Entry** — the app-layer join of a run + its artifact + its model + its scores.
Not a table. `src/lib/types.ts` defines it and `src/lib/queries.ts` is the only
place that builds one. Pages consume `Entry`, never raw rows.

**Ballot / vote** — one head-to-head preference, recorded as
(task, winner_run, loser_run, voter_key). Table: `votes`.

## The two kinds of judgement — never mix them

Benchlee has exactly two evidence types and they are kept in separate columns
everywhere, including the `model_standings` view. Averaging them produces a
number that means neither thing, so don't.

**Blind vote** — a historical preference recorded with model labels hidden. The
leaderboard remains ordered by historical win rate, with editorial scores breaking
ties. Voting is now closed; historical votes are a popularity signal.

**Editorial rubric** — 0–10 scores with written rationales, `judge = 'editorial'`.
A stated opinion, not a measurement. Displayed *next to* win rate, never folded
into it. Every score links back to the artifact it describes.

## Provenance — the honesty boundary

`runs.provenance` is either:

- **`demo`** — a shipped fixture from `db/seed/`. Exists so a fresh install has
  something to show. **Not** a transcript of a real API call. Rendered behind a
  **Demo** badge in the UI, disclosed on `/methodology`, and stated in the README.
- **`live`** — written by `scripts/run-benchmark.mjs` from a real provider
  response, with real latency and token counts. Renders with no badge.

This distinction is load-bearing, not cosmetic. **Never write a `live` row from
anything but an actual API response, and never remove a Demo badge from seeded
data.** The runner is written to skip and report rather than fill in a gap.

Similarly, seeded ballots use a `seed:editorial:*` voter key and real visitor
votes use `v:<uuid>`; `/leaderboard` reports community votes separately so the
seeded shape is never passed off as turnout.

## Read-only browsing

Benchlee is a read-only benchmark site. Visitors browse original artifacts,
compare labelled outputs, and inspect run telemetry and editorial rationales.
There are no public voting or custom-run submission controls.

**Arena** (`/arena`) — retired; redirects to labelled `/compare`, preserving
benchmark and model query parameters. `/api/vote` returns HTTP 410 without writes.

**Compare** (`/compare`) — labelled side-by-side artifacts and run details.

`/benchmark` redirects to `/tasks`; `/api/benchmark` returns HTTP 410 without
provider calls or writes. Saved `/benchmark/[id]` results remain readable.
Operators can still publish curated live runs using `scripts/run-benchmark.mjs`.
Historical ballots remain stored; seeded turnout is never presented as community
participation. Editorial scores and historical win rates remain separate.

## Viewport

Each task declares `viewport_w` / `viewport_h` — the size its artifacts are laid
out at. `ArtifactFrame` renders the iframe at exactly that size and scales it to
fit the card, so every model is judged at the same viewport regardless of the
grid it happens to be sitting in. Changing a task's viewport changes how every
existing artifact for it reads, so treat it as a breaking change to the
comparison.
