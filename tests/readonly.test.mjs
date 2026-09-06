import test from 'node:test';
import assert from 'node:assert/strict';
import './fixtures/readonly.mjs';
import fixture from './fixtures/readonly.mjs';
import { renderToStaticMarkup } from 'react-dom/server';
import { POST as vote } from '../src/app/api/vote/route.ts';
import { POST as run } from '../src/app/api/benchmark/route.ts';
import { GET as raw } from '../src/app/api/benchmark/[id]/raw/route.ts';
import Home from '../src/app/page.tsx';
import Tasks from '../src/app/tasks/page.tsx';
import Task from '../src/app/tasks/[slug]/page.tsx';
import Models from '../src/app/models/page.tsx';
import Model from '../src/app/models/[slug]/page.tsx';
import Artifact from '../src/app/a/[id]/page.tsx';
import Compare from '../src/app/compare/page.tsx';
import Leaderboard from '../src/app/leaderboard/page.tsx';
import Method from '../src/app/methodology/page.tsx';
import Saved from '../src/app/benchmark/[id]/page.tsx';
import Missing from '../src/app/not-found.tsx';
import Arena from '../src/app/arena/page.tsx';
import Benchmark from '../src/app/benchmark/page.tsx';
const html = async (page, props = {}) => renderToStaticMarkup(await page(props));

test('public mutation endpoints reject even authenticated submissions without side effects', async () => {
  const originalFetch = globalThis.fetch;
  const originalQuery = globalThis.benchleePool.query;
  globalThis.fetch = () => { throw new Error('Provider call attempted'); };
  globalThis.benchleePool.query = () => { throw new Error('Database access attempted'); };
  try {
    for (const handler of [vote, run]) {
      const response = await handler(new Request('http://localhost', { method: 'POST', headers: { authorization: 'Bearer previously-valid-token' }, body: '{}' }));
      assert.equal(response.status, 410);
      assert.match((await response.json()).error, /read-only/);
    }
  } finally { globalThis.fetch = originalFetch; globalThis.benchleePool.query = originalQuery; }
});

test('all page types render concise read-only browsing with preserved demo evidence', async () => {
  const pages = [
    [Home], [Tasks], [Task, { params: Promise.resolve({ slug: fixture.tasks[0].slug }) }],
    [Models], [Model, { params: Promise.resolve({ slug: fixture.models[0].slug }) }],
    [Artifact, { params: Promise.resolve({ id: fixture.rows[0].artifact_public_id }) }],
    [Compare, { searchParams: Promise.resolve({}) }], [Leaderboard], [Method],
    [Saved, { params: Promise.resolve({ id: fixture.saved.id }) }], [Missing],
  ];
  const rendered = [];
  for (const [page, props] of pages) {
    const output = await html(page, props);
    assert.doesNotMatch(output, /href="\/(?:arena|benchmark)(?:\?|"|\/\")|<form|Vote on|Pick any|Play blind|Run another|Guess blind/);
    rendered.push(output);
  }
  assert.match(rendered[0], /See what models build\./);
  assert.doesNotMatch(rendered[0], /Why this exists|bg-grid|trust the compression/);
  for (const index of [0, 1, 2, 3, 4, 5, 6]) assert.match(rendered[index], /Demo/);
  assert.match(rendered[2], /<details[^>]*><summary>Prompt/);
  assert.match(rendered[5], /Fixture rationale preserved verbatim/);
  assert.match(rendered[5], /fixture-run-1-1/);
  assert.match(rendered[7], /Historical standings/);
  assert.match(rendered[7], /Community votes/);
  assert.match(rendered[8], /Demo dataset/);
  assert.match(rendered[8], /does not measure reasoning/);
  assert.match(rendered[8], /never blended/);
  assert.match(rendered[9], /Unknown.*input tokens/);
  assert.match(rendered[9], /&lt;script&gt;/);
  assert.doesNotMatch(rendered[9], /<script>fetch/);
});

test('retired entry points redirect and saved raw results remain isolated', async () => {
  await assert.rejects(() => Arena({ searchParams: Promise.resolve({ task: 'revenue-chart', a: 'gpt-5-2', b: 'claude-opus-5' }) }), e => e.digest.includes('/compare?task=revenue-chart&a=gpt-5-2&b=claude-opus-5'));
  assert.throws(() => Benchmark(), e => e.digest.includes('/tasks'));
  const response = await raw(new Request('http://localhost'), { params: Promise.resolve({ id: fixture.saved.id }) });
  assert.equal(response.status, 200);
  assert.equal(await response.text(), fixture.saved.content);
  assert.match(response.headers.get('content-security-policy'), /default-src 'none'/);
  assert.match(response.headers.get('content-security-policy'), /sandbox allow-scripts/);
  assert.doesNotMatch(response.headers.get('content-security-policy'), /allow-same-origin/);
});
