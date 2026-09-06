// Read-only rendering fixture. Never connects to a database or writes live rows.
import fs from 'node:fs';
import path from 'node:path';
const catalog = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'db/seed/catalog.json'), 'utf8'));
const models = catalog.models.map((m, i) => ({ ...m, id: i + 1 }));
const tasks = catalog.tasks.map((t, i) => ({ ...t, id: i + 1 }));
const rows = tasks.flatMap(t => models.map(m => ({
  run_id: t.id * 100 + m.id, run_public_id: `fixture-run-${t.id}-${m.id}`,
  provenance: 'demo', status: 'ok', latency_ms: 1200, input_tokens: 10, output_tokens: 20,
  cost_usd: '0.01', ran_at: new Date('2026-01-01T00:00:00Z'),
  artifact_id: t.id * 100 + m.id, artifact_public_id: `fixture-artifact-${t.id}-${m.id}`,
  artifact_kind: 'html', artifact_title: t.title, byte_size: 2000,
  task_slug: t.slug, task_title: t.title, model_id: m.id, model_slug: m.slug,
  model_name: m.name, model_vendor: m.vendor, model_badge: m.badge, model_accent: m.accent_hex,
  model_context_window: m.context_window, model_homepage: m.homepage_url,
  model_notes: m.notes, model_position: m.position,
  scores: [{ dimension: t.rubric[0].key, value: 7, judge: 'editorial', rationale: 'Fixture rationale preserved verbatim.' }], wins: 2, losses: 1,
})));
const saved = { id: '11111111-1111-4111-8111-111111111111', prompt: '  Fixture prompt.\nKeep whitespace.  ', option: { apiModel: 'Fixture model', provider: 'openai', effort: 'Provider default' }, content: '<h1>Saved fixture</h1><script>/* untouched fixture source */</script>', latencyMs: 1000, inputTokens: null, outputTokens: null };
async function query(sql, args = []) {
  if (/\b(INSERT|UPDATE|DELETE)\b/.test(sql)) throw new Error('Unexpected write');
  let result;
  if (sql.includes('FROM custom_benchmark_results')) result = args[0] === saved.id ? [saved] : [];
  else if (sql.includes('SELECT content, kind FROM artifacts')) {
    const row = rows.find(r => r.artifact_public_id === args[0]);
    result = row ? [{ kind: 'html', content: fs.readFileSync(path.join(process.cwd(), `db/seed/artifacts/${row.task_slug}/${row.model_slug}.html`), 'utf8') }] : [];
  } else if (sql.includes('FROM model_standings')) result = models.map(m => ({ ...m, win_rate: '0.6667', rubric_avg: '7', wins: 2, losses: 1, matchups: 3, run_count: tasks.length, artifact_count: tasks.length }));
  else if (sql.includes('AS community_votes')) result = [{ models: models.length, tasks: tasks.length, artifacts: rows.length, votes: 10, community_votes: 0, live_runs: 0 }];
  else if (sql.includes('SELECT r.id')) {
    result = rows;
    if (sql.includes('a.public_id = $1')) result = rows.filter(r => r.artifact_public_id === args[0]);
    else if (sql.includes('WHERE t.slug = $1')) result = rows.filter(r => r.task_slug === args[0]);
    else if (sql.includes('WHERE m.slug = $1')) result = rows.filter(r => r.model_slug === args[0]);
  } else if (sql.includes('FROM tasks')) result = sql.includes('WHERE slug = $1') ? tasks.filter(t => t.slug === args[0]) : tasks;
  else if (sql.includes('FROM models')) result = sql.includes('WHERE slug = $1') ? models.filter(m => m.slug === args[0]) : models;
  else throw new Error(`Unexpected fixture query: ${sql}`);
  return { rows: result };
}
globalThis.benchleePool = { query };
const fixture = { models, tasks, rows, saved };
export default fixture;
