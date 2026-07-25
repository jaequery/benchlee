export type Provenance = "demo" | "live";

export type Model = {
  id: number;
  slug: string;
  name: string;
  vendor: string;
  badge: string;
  accent_hex: string;
  context_window: number | null;
  homepage_url: string | null;
  notes: string | null;
  position: number;
};

export type RubricDimension = { key: string; label: string };

export type Task = {
  id: number;
  slug: string;
  title: string;
  category: string;
  summary: string;
  prompt: string;
  why_it_matters: string;
  rubric: RubricDimension[];
  render_mode: "html" | "svg" | "image";
  viewport_w: number;
  viewport_h: number;
  position: number;
};

export type Score = {
  dimension: string;
  value: number;
  judge: string;
  rationale: string | null;
};

/** A model's answer to one task: the artifact, plus everything that qualifies it. */
export type Entry = {
  run_id: number;
  run_public_id: string;
  provenance: Provenance;
  status: string;
  latency_ms: number | null;
  input_tokens: number | null;
  output_tokens: number | null;
  cost_usd: number | null;
  ran_at: string;
  artifact_id: number;
  artifact_public_id: string;
  artifact_kind: "html" | "svg" | "image" | "text";
  artifact_title: string;
  byte_size: number | null;
  model: Model;
  task_slug: string;
  task_title: string;
  scores: Score[];
  wins: number;
  losses: number;
};

export type Standing = {
  id: number;
  slug: string;
  name: string;
  vendor: string;
  badge: string;
  accent_hex: string;
  wins: number;
  losses: number;
  matchups: number;
  win_rate: number | null;
  rubric_avg: number | null;
  run_count: number;
  artifact_count: number;
};

export function rubricAverage(scores: Score[]): number | null {
  if (scores.length === 0) return null;
  const total = scores.reduce((sum, s) => sum + Number(s.value), 0);
  return Math.round((total / scores.length) * 100) / 100;
}
