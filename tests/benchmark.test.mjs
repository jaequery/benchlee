import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { configuredOptions, validateBenchmarkInput, providerRequest, providerOutput, runComparison } from "../src/lib/benchmark-core.ts";
import runtime from "../db/seed/models.runtime.json";

const env = { ANTHROPIC_API_KEY: "fixture-key", OPENAI_API_KEY: "fixture-key", GOOGLE_API_KEY: "fixture-key" };
const options = configuredOptions(runtime, env);
const prompt = "  Build a page.\nKeep this prompt verbatim.  ";

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

test("preview preserves opaque iframe sandbox and common comparison viewport", async () => {
  const frame = await readFile(new URL("../src/components/ArtifactFrame.tsx", import.meta.url), "utf8");
  assert.match(frame, /sandbox="allow-scripts"/);
  assert.ok(!frame.includes('sandbox="allow-scripts allow-same-origin"'));
  const { BENCHMARK_VIEWPORT } = await import("../src/lib/benchmark-types.ts");
  assert.deepEqual(BENCHMARK_VIEWPORT, { width: 1280, height: 800 });
});

test("operator input validation rejects invalid prompts and model options", () => {
  assert.throws(() => validateBenchmarkInput({ prompt: "   ", optionId: options[0].id }, options));
  assert.throws(() => validateBenchmarkInput({ prompt, optionId: "" }, options));
  assert.throws(() => validateBenchmarkInput({ prompt: "x".repeat(20001), optionId: options[0].id }, options));
});
