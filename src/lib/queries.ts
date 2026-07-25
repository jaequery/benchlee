import "server-only";
import { query, queryOne } from "./db";
import type { Entry, Model, Standing, Task } from "./types";

// Every page in Benchlee reads through these helpers. The shape they return is
// artifact-first on purpose: an Entry always carries its artifact, and scores
// ride along as a nested array you have to opt into displaying.

const ENTRY_SELECT = `
  SELECT r.id                AS run_id,
         r.public_id         AS run_public_id,
         r.provenance,
         r.status,
         r.latency_ms,
         r.input_tokens,
         r.output_tokens,
         r.cost_usd,
         r.ran_at,
         a.id                AS artifact_id,
         a.public_id         AS artifact_public_id,
         a.kind              AS artifact_kind,
         a.title             AS artifact_title,
         a.byte_size,
         t.slug              AS task_slug,
         t.title             AS task_title,
         m.id                AS model_id,
         m.slug              AS model_slug,
         m.name              AS model_name,
         m.vendor            AS model_vendor,
         m.badge             AS model_badge,
         m.accent_hex        AS model_accent,
         m.context_window    AS model_context_window,
         m.homepage_url      AS model_homepage,
         m.notes             AS model_notes,
         m.position          AS model_position,
         COALESCE(sc.scores, '[]'::json)                       AS scores,
         (SELECT count(*) FROM votes v WHERE v.winner_run_id = r.id)::int AS wins,
         (SELECT count(*) FROM votes v WHERE v.loser_run_id  = r.id)::int AS losses
  FROM runs r
  JOIN models m ON m.id = r.model_id
  JOIN tasks  t ON t.id = r.task_id
  JOIN LATERAL (
    SELECT * FROM artifacts a2 WHERE a2.run_id = r.id ORDER BY a2.id LIMIT 1
  ) a ON TRUE
  LEFT JOIN LATERAL (
    SELECT json_agg(json_build_object(
             'dimension', s.dimension,
             'value', s.value::float8,
             'judge', s.judge,
             'rationale', s.rationale
           ) ORDER BY s.dimension) AS scores
    FROM scores s WHERE s.run_id = r.id
  ) sc ON TRUE
`;

type EntryRow = {
  run_id: number;
  run_public_id: string;
  provenance: "demo" | "live";
  status: string;
  latency_ms: number | null;
  input_tokens: number | null;
  output_tokens: number | null;
  cost_usd: string | null;
  ran_at: Date;
  artifact_id: number;
  artifact_public_id: string;
  artifact_kind: "html" | "svg" | "image" | "text";
  artifact_title: string;
  byte_size: number | null;
  task_slug: string;
  task_title: string;
  model_id: number;
  model_slug: string;
  model_name: string;
  model_vendor: string;
  model_badge: string;
  model_accent: string;
  model_context_window: number | null;
  model_homepage: string | null;
  model_notes: string | null;
  model_position: number;
  scores: Entry["scores"];
  wins: number;
  losses: number;
};

function toEntry(row: EntryRow): Entry {
  return {
    run_id: row.run_id,
    run_public_id: row.run_public_id,
    provenance: row.provenance,
    status: row.status,
    latency_ms: row.latency_ms,
    input_tokens: row.input_tokens,
    output_tokens: row.output_tokens,
    cost_usd: row.cost_usd === null ? null : Number(row.cost_usd),
    ran_at: new Date(row.ran_at).toISOString(),
    artifact_id: row.artifact_id,
    artifact_public_id: row.artifact_public_id,
    artifact_kind: row.artifact_kind,
    artifact_title: row.artifact_title,
    byte_size: row.byte_size,
    task_slug: row.task_slug,
    task_title: row.task_title,
    scores: row.scores ?? [],
    wins: row.wins,
    losses: row.losses,
    model: {
      id: row.model_id,
      slug: row.model_slug,
      name: row.model_name,
      vendor: row.model_vendor,
      badge: row.model_badge,
      accent_hex: row.model_accent,
      context_window: row.model_context_window,
      homepage_url: row.model_homepage,
      notes: row.model_notes,
      position: row.model_position,
    },
  };
}

export async function listTasks(): Promise<Task[]> {
  return query<Task>(
    `SELECT id, slug, title, category, summary, prompt, why_it_matters, rubric,
            render_mode, viewport_w, viewport_h, position
     FROM tasks ORDER BY position, id`,
  );
}

export async function getTask(slug: string): Promise<Task | null> {
  return queryOne<Task>(
    `SELECT id, slug, title, category, summary, prompt, why_it_matters, rubric,
            render_mode, viewport_w, viewport_h, position
     FROM tasks WHERE slug = $1`,
    [slug],
  );
}

export async function listModels(): Promise<Model[]> {
  return query<Model>(
    `SELECT id, slug, name, vendor, badge, accent_hex, context_window,
            homepage_url, notes, position
     FROM models ORDER BY position, id`,
  );
}

export async function getModel(slug: string): Promise<Model | null> {
  return queryOne<Model>(
    `SELECT id, slug, name, vendor, badge, accent_hex, context_window,
            homepage_url, notes, position
     FROM models WHERE slug = $1`,
    [slug],
  );
}

/** Newest run per model for one task — the side-by-side gallery. */
export async function entriesForTask(taskSlug: string): Promise<Entry[]> {
  const rows = await query<EntryRow>(
    `WITH latest AS (
       SELECT DISTINCT ON (r.model_id) r.id
       FROM runs r JOIN tasks t ON t.id = r.task_id
       WHERE t.slug = $1 AND r.status = 'ok'
       ORDER BY r.model_id, r.ran_at DESC
     )
     ${ENTRY_SELECT}
     WHERE r.id IN (SELECT id FROM latest)
     ORDER BY m.position, m.id`,
    [taskSlug],
  );
  return rows.map(toEntry);
}

/** Newest run per task for one model — the model profile. */
export async function entriesForModel(modelSlug: string): Promise<Entry[]> {
  const rows = await query<EntryRow>(
    `WITH latest AS (
       SELECT DISTINCT ON (r.task_id) r.id
       FROM runs r JOIN models m ON m.id = r.model_id
       WHERE m.slug = $1 AND r.status = 'ok'
       ORDER BY r.task_id, r.ran_at DESC
     )
     ${ENTRY_SELECT}
     WHERE r.id IN (SELECT id FROM latest)
     ORDER BY t.position, t.id`,
    [modelSlug],
  );
  return rows.map(toEntry);
}

export async function entryByRunPublicId(publicId: string): Promise<Entry | null> {
  const rows = await query<EntryRow>(
    `${ENTRY_SELECT} WHERE r.public_id = $1 LIMIT 1`,
    [publicId],
  );
  return rows[0] ? toEntry(rows[0]) : null;
}

export async function entryByArtifactPublicId(publicId: string): Promise<Entry | null> {
  const rows = await query<EntryRow>(
    `${ENTRY_SELECT} WHERE a.public_id = $1 LIMIT 1`,
    [publicId],
  );
  return rows[0] ? toEntry(rows[0]) : null;
}

export async function entryForPair(
  taskSlug: string,
  modelSlug: string,
): Promise<Entry | null> {
  const rows = await query<EntryRow>(
    `${ENTRY_SELECT}
     WHERE t.slug = $1 AND m.slug = $2 AND r.status = 'ok'
     ORDER BY r.ran_at DESC LIMIT 1`,
    [taskSlug, modelSlug],
  );
  return rows[0] ? toEntry(rows[0]) : null;
}

/** Raw artifact body, for the sandboxed render route. */
export async function artifactContent(
  publicId: string,
): Promise<{ content: string; kind: string } | null> {
  return queryOne<{ content: string; kind: string }>(
    `SELECT content, kind FROM artifacts WHERE public_id = $1 AND content IS NOT NULL`,
    [publicId],
  );
}

export async function standings(): Promise<Standing[]> {
  const rows = await query<
    Omit<Standing, "win_rate" | "rubric_avg"> & {
      win_rate: string | null;
      rubric_avg: string | null;
    }
  >(
    `SELECT id, slug, name, vendor, badge, accent_hex, wins, losses, matchups,
            win_rate, rubric_avg, run_count, artifact_count
     FROM model_standings
     ORDER BY win_rate DESC NULLS LAST, rubric_avg DESC NULLS LAST, name`,
  );
  return rows.map((r) => ({
    ...r,
    win_rate: r.win_rate === null ? null : Number(r.win_rate),
    rubric_avg: r.rubric_avg === null ? null : Number(r.rubric_avg),
  }));
}

export type SiteStats = {
  models: number;
  tasks: number;
  artifacts: number;
  votes: number;
  community_votes: number;
  live_runs: number;
};

export async function siteStats(): Promise<SiteStats> {
  const row = await queryOne<Record<keyof SiteStats, string>>(
    `SELECT (SELECT count(*) FROM models)    AS models,
            (SELECT count(*) FROM tasks)     AS tasks,
            (SELECT count(*) FROM artifacts) AS artifacts,
            (SELECT count(*) FROM votes)     AS votes,
            (SELECT count(*) FROM votes WHERE voter_key NOT LIKE 'seed:%') AS community_votes,
            (SELECT count(*) FROM runs WHERE provenance = 'live')          AS live_runs`,
  );
  return {
    models: Number(row?.models ?? 0),
    tasks: Number(row?.tasks ?? 0),
    artifacts: Number(row?.artifacts ?? 0),
    votes: Number(row?.votes ?? 0),
    community_votes: Number(row?.community_votes ?? 0),
    live_runs: Number(row?.live_runs ?? 0),
  };
}

/**
 * Picks a blind matchup: one task, two different models' latest artifacts.
 * `seed` makes the choice deterministic per request so the server render and the
 * share link agree; omit it for a fresh random pairing.
 */
export async function randomMatchup(
  seed?: string,
): Promise<{ task: Task; left: Entry; right: Entry } | null> {
  const tasks = await listTasks();
  if (tasks.length === 0) return null;

  const n = seed ? hash(seed) : Math.floor(Math.random() * 1_000_003);
  const task = tasks[n % tasks.length];
  const entries = await entriesForTask(task.slug);
  if (entries.length < 2) return null;

  const a = n % entries.length;
  let b = (n >> 3) % entries.length;
  if (b === a) b = (a + 1) % entries.length;
  return { task, left: entries[a], right: entries[b] };
}

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export async function recordVote(params: {
  taskId: number;
  winnerRunId: number;
  loserRunId: number;
  blind: boolean;
  voterKey: string;
}): Promise<void> {
  await query(
    `INSERT INTO votes (task_id, winner_run_id, loser_run_id, blind, voter_key)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      params.taskId,
      params.winnerRunId,
      params.loserRunId,
      params.blind,
      params.voterKey,
    ],
  );
}

/** Per-task head-to-head record for one run, used on the artifact detail page. */
export async function runRecord(runId: number): Promise<{ wins: number; losses: number }> {
  const row = await queryOne<{ wins: string; losses: string }>(
    `SELECT (SELECT count(*) FROM votes WHERE winner_run_id = $1) AS wins,
            (SELECT count(*) FROM votes WHERE loser_run_id  = $1) AS losses`,
    [runId],
  );
  return { wins: Number(row?.wins ?? 0), losses: Number(row?.losses ?? 0) };
}
