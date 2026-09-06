-- User prompts are deliberately separate from curated tasks, runs and votes.
CREATE TABLE IF NOT EXISTS custom_benchmark_results (
  id UUID PRIMARY KEY,
  prompt TEXT NOT NULL,
  option JSONB NOT NULL,
  content TEXT NOT NULL,
  latency_ms INTEGER NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
