import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { configuredOptions, validateBenchmarkInput, providerRequest, providerOutput, runComparison } from "../src/lib/benchmark-core.ts";
import { BenchmarkBoard } from "../src/components/BenchmarkBoard.tsx";
import runtime from "../db/seed/models.runtime.json";
import { POST } from "../src/app/api/benchmark/route.ts";
import { GET } from "../src/app/api/benchmark/[id]/raw/route.ts";
import BenchmarkResultPage from "../src/app/benchmark/[id]/page.tsx";
import { getBenchmarkResult } from "../src/lib/queries.ts";
import { pool } from "../src/lib/db.ts";

const env = { ANTHROPIC_API_KEY: "fixture-key", OPENAI_API_KEY: "fixture-key", GOOGLE_API_KEY: "fixture-key" };
const options = configuredOptions(runtime, env);
const prompt = "  Build a page.\nKeep this prompt verbatim.  ";

test("form renders every configured model/effort checked and disallows an empty launch", () => {
  const html = renderToStaticMarkup(React.createElement(BenchmarkBoard, { options, enabled: true }));
  assert.equal((html.match(/type="checkbox"/g) ?? []).length, options.length);
  assert.equal((html.match(/checked=""/g) ?? []).length, options.length);
  assert.match(html, /<label[^>]+for="benchmark-prompt"/);
  assert.match(html, /<button[^>]+type="submit"[^>]+disabled=""/);
  for (const option of options) assert.ok(html.includes(option.apiModel));
  assert.throws(() => validateBenchmarkInput({ prompt: "   ", optionId: options[0].id }, options));
  assert.throws(() => validateBenchmarkInput({ prompt, optionId: "" }, options));
  assert.throws(() => validateBenchmarkInput({ prompt: "x".repeat(20001), optionId: options[0].id }, options));
});

test("only selected pairs execute once, preserve prompt, and transmit configured effort", async () => {
  const chosen = options.filter((o) => o.id.includes("budget-"));
  assert.equal(chosen.length, 2);
  const calls = [];
  await runComparison(prompt, chosen, async (sent, option) => {
    calls.push(option.id);
    assert.equal(sent, prompt);
    const request = providerRequest(option, sent, "fixture-key");
    assert.equal(request.body.contents[0].parts[0].text, prompt);
    assert.deepEqual(request.body.generationConfig.thinkingConfig, option.parameters.thinkingConfig);
    return { id: option.id };
  }, () => {});
  assert.deepEqual(calls.sort(), chosen.map((o) => o.id).sort());
  let called = false;
  await runComparison(prompt, [], async () => { called = true; }, () => {});
  assert.equal(called, false);
  for (const option of options.filter((o) => o.provider !== "google")) {
    const request = providerRequest(option, prompt, "fixture-key");
    assert.equal(request.body.model, option.apiModel);
    assert.equal(request.body.messages[0].content, prompt);
  }
});

test("comparison isolates failures and unavailable providers and bounds concurrency", async () => {
  const states = new Map();
  const chosen = [...options, { ...options[0], id: "missing", available: false }];
  let active = 0;
  let peak = 0;
  await runComparison(prompt, chosen, async (_prompt, option) => {
    active++;
    peak = Math.max(peak, active);
    await new Promise((resolve) => setTimeout(resolve, 5));
    active--;
    if (option.id === options[0].id) throw new Error("Fixture failure");
    return { id: option.id };
  }, (state) => states.set(state.option.id, state));
  assert.ok(peak <= 3);
  assert.equal(states.get(options[0].id).status, "error");
  assert.equal(states.get(options[1].id).status, "success");
  assert.equal(states.get("missing").status, "unavailable");
});

test("provider output stays verbatim and missing telemetry is never zero-filled", () => {
  const content = "```html\n<h1>raw</h1>\n```";
  assert.deepEqual(providerOutput("openai", { choices: [{ message: { content } }] }), { content, inputTokens: null, outputTokens: null });
  assert.equal(providerOutput("anthropic", { content: [{ type: "text", text: content }] }).content, content);
  assert.deepEqual(providerOutput("google", { candidates: [{ content: { parts: [{ thought: true, text: "private thinking" }, { text: content }] } }], usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 20, thoughtsTokenCount: 30 } }), { content, inputTokens: 10, outputTokens: 50 });
  assert.throws(() => providerOutput("openai", { choices: [] }), /no artifact/);
});

test("HTTP execution validates credentials/input, persists only actual responses, and serves isolated artifacts", async () => {
  const previous = { ...process.env };
  const originalFetch = globalThis.fetch;
  process.env.DATABASE_URL = "postgres://fixture:fixture@localhost:1/fixture";
  const database = pool();
  const originalQuery = database.query;
  const saved = new Map();
  const statements = [];
  // A database double keeps fixtures out of real live tables. Assert the actual
  // SQL boundary, round trip parameters, HTTP statuses and raw response headers.
  database.query = async (sql, args) => {
    statements.push(sql);
    if (sql.includes("INSERT INTO custom_benchmark_results")) {
      const [id, prompt, option, content, latencyMs, inputTokens, outputTokens] = args;
      saved.set(id, { id, prompt, option: JSON.parse(option), content, latencyMs, inputTokens, outputTokens });
      return { rows: [] };
    }
    if (sql.includes("FROM custom_benchmark_results")) return { rows: saved.has(args[0]) ? [saved.get(args[0])] : [] };
    throw new Error("Unexpected SQL");
  };
  let calls = 0;
  globalThis.fetch = async (_url, init) => {
    calls++;
    assert.equal(JSON.parse(init.body).messages[0].content, prompt);
    return Response.json({ choices: [{ message: { content: "<h1>Fixture</h1><script>fetch('https://example.com')</script>" } }], usage: { prompt_tokens: 7, completion_tokens: 9 } });
  };
  const request = (body, token = "fixture-access") => new Request("http://localhost/api/benchmark", { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify(body) });
  const body = { prompt, optionId: "gpt-5-2:default" };
  try {
    delete process.env.BENCHMARK_ACCESS_TOKEN;
    assert.equal((await POST(request(body))).status, 503);
    process.env.BENCHMARK_ACCESS_TOKEN = "fixture-access";
    assert.equal((await POST(request(body, "bad"))).status, 401);
    assert.equal((await POST(request({ ...body, optionId: "invented:high" }))).status, 400);
    assert.equal((await POST(request({ ...body, prompt: " " }))).status, 400);
    delete process.env.OPENAI_API_KEY;
    assert.equal((await POST(request(body))).status, 503);
    assert.equal(calls, 0);
    process.env.OPENAI_API_KEY = "fixture-key";
    const response = await POST(request(body));
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(calls, 1);
    assert.equal(saved.size, 1);
    assert.equal(result.prompt, prompt);
    assert.equal(result.option.apiModel, "gpt-4o");
    assert.equal(result.inputTokens, 7);
    assert.equal(result.outputTokens, 9);
    assert.ok(result.latencyMs >= 0);
    assert.equal((await getBenchmarkResult(result.id)).content, result.content);
    const detail = renderToStaticMarkup(await BenchmarkResultPage({ params: Promise.resolve({ id: result.id }) }));
    assert.ok(detail.includes("gpt-4o"));
    assert.ok(detail.includes("Provider default"));
    assert.ok(detail.includes("Verbatim artifact source"));
    assert.ok(detail.includes("&lt;script&gt;"));
    assert.ok(!detail.includes("<script>fetch"));
    assert.ok(detail.indexOf("rendering artifact") < detail.indexOf("input tokens"));
    const raw = await GET(new Request("http://localhost"), { params: Promise.resolve({ id: result.id }) });
    assert.equal(await raw.text(), result.content);
    assert.match(raw.headers.get("content-security-policy"), /default-src 'none'/);
    assert.match(raw.headers.get("content-security-policy"), /sandbox allow-scripts/);
    assert.ok(!raw.headers.get("content-security-policy").includes("allow-same-origin"));
    assert.equal((await GET(new Request("http://localhost"), { params: Promise.resolve({ id: "invalid" }) })).status, 404);
    globalThis.fetch = async () => new Response("secret upstream details", { status: 429 });
    const failed = await POST(request(body));
    assert.equal(failed.status, 502);
    assert.ok(!(await failed.text()).includes("secret upstream"));
    globalThis.fetch = async () => Response.json({ choices: [] });
    assert.equal((await POST(request(body))).status, 502);
    assert.equal(saved.size, 1);
    assert.ok(statements.every((sql) => !/\b(?:INSERT INTO|UPDATE)\s+(?:runs|tasks|votes|scores|artifacts)\b/i.test(sql)));
  } finally {
    globalThis.fetch = originalFetch;
    database.query = originalQuery;
    for (const key of ["DATABASE_URL", "BENCHMARK_ACCESS_TOKEN", "OPENAI_API_KEY"]) {
      if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key];
    }
    await database.end();
  }
});

test("preview preserves opaque iframe sandbox and common comparison viewport", async () => {
  const frame = await readFile(new URL("../src/components/ArtifactFrame.tsx", import.meta.url), "utf8");
  assert.match(frame, /sandbox="allow-scripts"/);
  assert.ok(!frame.includes('sandbox="allow-scripts allow-same-origin"'));
  const { BENCHMARK_VIEWPORT } = await import("../src/lib/benchmark-types.ts");
  assert.deepEqual(BENCHMARK_VIEWPORT, { width: 1280, height: 800 });
});
