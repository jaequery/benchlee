-- Benchlee core schema.
--
-- Design note: the unit of truth in Benchlee is the ARTIFACT (what a model
-- actually produced), not a score. `runs` exist to give an artifact provenance,
-- and `scores` are deliberately a leaf table hanging off a run — a number here
-- is never displayed without a link back to the artifact it came from.

CREATE TABLE IF NOT EXISTS models (
  id             SERIAL PRIMARY KEY,
  slug           TEXT UNIQUE NOT NULL,
  name           TEXT NOT NULL,
  vendor         TEXT NOT NULL,
  badge          TEXT NOT NULL,
  accent_hex     TEXT NOT NULL DEFAULT '#c8ff2e',
  released_on    DATE,
  context_window INTEGER,
  homepage_url   TEXT,
  notes          TEXT,
  position       INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id          SERIAL PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,
  title       TEXT NOT NULL,
  category    TEXT NOT NULL,
  summary     TEXT NOT NULL,
  prompt      TEXT NOT NULL,
  why_it_matters TEXT NOT NULL DEFAULT '',
  rubric      JSONB NOT NULL DEFAULT '[]'::jsonb,
  render_mode TEXT NOT NULL DEFAULT 'html'
    CONSTRAINT tasks_render_mode_check CHECK (render_mode IN ('html', 'svg', 'image')),
  viewport_w  INTEGER NOT NULL DEFAULT 1280,
  viewport_h  INTEGER NOT NULL DEFAULT 800,
  position    INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS runs (
  id            SERIAL PRIMARY KEY,
  public_id     TEXT UNIQUE NOT NULL,
  model_id      INTEGER NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  task_id       INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  -- 'demo'  = shipped fixture, shown with a Demo badge in the UI
  -- 'live'  = produced by scripts/run-benchmark.mjs against a real provider API
  provenance    TEXT NOT NULL DEFAULT 'demo'
    CONSTRAINT runs_provenance_check CHECK (provenance IN ('demo', 'live')),
  status        TEXT NOT NULL DEFAULT 'ok'
    CONSTRAINT runs_status_check CHECK (status IN ('ok', 'refused', 'error', 'timeout')),
  latency_ms    INTEGER,
  input_tokens  INTEGER,
  output_tokens INTEGER,
  cost_usd      NUMERIC(10, 5),
  temperature   NUMERIC(3, 2),
  error_text    TEXT,
  ran_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS runs_task_idx ON runs (task_id);
CREATE INDEX IF NOT EXISTS runs_model_idx ON runs (model_id);
-- A (task, model) pair can be re-run over time; the site shows the newest run,
-- so this index serves "latest run per pair" lookups rather than uniqueness.
CREATE INDEX IF NOT EXISTS runs_latest_per_pair_idx
  ON runs (task_id, model_id, ran_at DESC);

CREATE TABLE IF NOT EXISTS artifacts (
  id           SERIAL PRIMARY KEY,
  public_id    TEXT UNIQUE NOT NULL,
  run_id       INTEGER NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  kind         TEXT NOT NULL
    CONSTRAINT artifacts_kind_check CHECK (kind IN ('html', 'svg', 'image', 'text')),
  title        TEXT NOT NULL,
  content      TEXT,
  storage_path TEXT,
  byte_size    INTEGER,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT artifacts_payload_check CHECK (
    (kind = 'image' AND storage_path IS NOT NULL) OR
    (kind <> 'image' AND content IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS artifacts_run_idx ON artifacts (run_id);

CREATE TABLE IF NOT EXISTS scores (
  id        SERIAL PRIMARY KEY,
  run_id    INTEGER NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  dimension TEXT NOT NULL,
  value     NUMERIC(4, 2) NOT NULL
    CONSTRAINT scores_value_range CHECK (value >= 0 AND value <= 10),
  judge     TEXT NOT NULL DEFAULT 'editorial',
  rationale TEXT,
  UNIQUE (run_id, dimension, judge)
);

CREATE TABLE IF NOT EXISTS votes (
  id            BIGSERIAL PRIMARY KEY,
  task_id       INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  winner_run_id INTEGER NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  loser_run_id  INTEGER NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  blind         BOOLEAN NOT NULL DEFAULT TRUE,
  voter_key     TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT votes_distinct_runs CHECK (winner_run_id <> loser_run_id)
);

CREATE INDEX IF NOT EXISTS votes_task_idx ON votes (task_id);
CREATE INDEX IF NOT EXISTS votes_winner_idx ON votes (winner_run_id);
CREATE INDEX IF NOT EXISTS votes_loser_idx ON votes (loser_run_id);
CREATE INDEX IF NOT EXISTS votes_voter_idx ON votes (voter_key, task_id);
