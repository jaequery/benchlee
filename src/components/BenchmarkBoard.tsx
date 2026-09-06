"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArtifactFrame } from "./ArtifactFrame";
import { runComparison } from "@/lib/benchmark-core";
import { BENCHMARK_VIEWPORT, type BenchmarkOption, type BenchmarkResult, type BenchmarkState } from "@/lib/benchmark-types";

export function BenchmarkBoard({ options, enabled }: { options: BenchmarkOption[]; enabled: boolean }) {
  const [prompt, setPrompt] = useState("");
  const [token, setToken] = useState("");
  const [selected, setSelected] = useState(() => new Set(options.map((o) => o.id)));
  const [states, setStates] = useState<BenchmarkState[]>([]);
  const [running, setRunning] = useState(false);
  const busy = useRef(false);
  const [submittedPrompt, setSubmittedPrompt] = useState("");
  const complete = states.filter((s) => s.status !== "running" && s.status !== "pending").length;

  async function bench(event: React.FormEvent) {
    event.preventDefault();
    if (busy.current || !prompt.trim() || !selected.size || !token || !enabled) return;
    busy.current = true;
    setRunning(true);
    setSubmittedPrompt(prompt);
    const chosen = options.filter((o) => selected.has(o.id));
    setStates(chosen.map((option) => ({ option, status: "pending" })));
    try {
      await runComparison(prompt, chosen, async (submitted, option) => {
        const response = await fetch("/api/benchmark", {
          method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
          body: JSON.stringify({ prompt: submitted, optionId: option.id }),
          signal: AbortSignal.timeout(150000),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Run failed.");
        return data as BenchmarkResult;
      }, (state) => setStates((current) => current.map((s) => s.option.id === state.option.id ? state : s)));
    } finally {
      busy.current = false;
      setRunning(false);
    }
  }

  return <>
    <form onSubmit={bench} className="mt-8 space-y-6 rounded-xl border border-ink-700 bg-ink-900 p-5 sm:p-6">
      <div>
        <label htmlFor="benchmark-prompt" className="block font-semibold text-ink-100">Your prompt</label>
        <p id="prompt-help" className="my-2 text-sm text-ink-400">For visual comparisons, ask for a self-contained HTML file. Your exact prompt is sent to every selected pair.</p>
        <textarea id="benchmark-prompt" aria-describedby="prompt-help" required maxLength={20000} rows={5} value={prompt} onChange={(e) => setPrompt(e.target.value)} disabled={running}
          placeholder="Build a pricing page for a small design studio. Return only a self-contained HTML file."
          className="w-full rounded-lg border border-ink-700 bg-ink-950 p-3 text-ink-100 focus:outline-lime-benchlee" />
      </div>
      <fieldset disabled={running}>
        <legend className="font-semibold text-ink-100">Models and effort levels</legend>
        <p className="mt-1 text-sm text-ink-400">Concrete API IDs are shown below. Effort settings are provider-specific.</p>
        <div className="my-3 flex gap-4 text-sm text-lime-benchlee">
          <button type="button" onClick={() => setSelected(new Set(options.map((o) => o.id)))}>Select all</button>
          <button type="button" onClick={() => setSelected(new Set())}>Clear selection</button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {options.map((option) => <label key={option.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-ink-700 p-3">
            <input type="checkbox" checked={selected.has(option.id)} onChange={(e) => setSelected((current) => {
              const next = new Set(current);
              if (e.target.checked) next.add(option.id); else next.delete(option.id);
              return next;
            })} className="mt-1 accent-lime-benchlee" />
            <span className="min-w-0 text-sm">
              <span className="block break-words font-semibold text-ink-100">{option.apiModel}</span>
              <span className="block text-ink-300">{option.effort}</span>
              <span className="block text-xs text-ink-500">{option.provider} · catalog: {option.model}</span>
              {!option.available && <span className="mt-1 block text-amber-300">Unavailable — provider key missing</span>}
            </span>
          </label>)}
        </div>
        {!options.length && <p className="text-amber-300">No models are configured.</p>}
      </fieldset>
      <div>
        <label htmlFor="benchmark-token" className="block text-sm font-medium text-ink-200">Benchmark access token</label>
        <input id="benchmark-token" type="password" autoComplete="off" required value={token} onChange={(e) => setToken(e.target.value)} disabled={running}
          className="mt-2 w-full rounded-lg border border-ink-700 bg-ink-950 p-2 sm:max-w-md" />
        <p className="mt-2 text-xs text-ink-400">Provided by the operator. Runs use the server’s provider account. Prompts and results are saved and accessible to anyone with their result link.</p>
      </div>
      {!enabled && <p role="status" className="text-sm text-amber-300">Execution is disabled until the operator configures BENCHMARK_ACCESS_TOKEN.</p>}
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={running || !enabled || !prompt.trim() || !selected.size || !token} className="rounded-lg bg-lime-benchlee px-6 py-2.5 font-semibold text-ink-950 disabled:cursor-not-allowed disabled:opacity-40">{running ? "Benching…" : "Bench"}</button>
        <span className="text-sm text-ink-400">{selected.size} pairs selected · up to 3 calls at a time</span>
      </div>
    </form>
    {states.length > 0 && <section className="mt-10" aria-label="Benchmark results">
      <div className="mb-5">
        <h2 className="text-2xl font-semibold text-ink-100">Compare artifacts</h2>
        <p role="status" aria-live="polite" className="mt-2 text-sm text-ink-400">{complete} of {states.length} finished. {running ? "Keep this page open while the comparison runs." : "Comparison finished."} Quality is yours to judge; speed is not a quality score.</p>
        <details className="mt-3 text-sm text-ink-300"><summary className="cursor-pointer">Prompt sent to these runs</summary><pre className="mt-2 whitespace-pre-wrap">{submittedPrompt}</pre></details>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-2">
        {states.map((state) => <article key={state.option.id} className="overflow-hidden rounded-xl border border-ink-700 bg-ink-900">
          <div className="flex flex-wrap items-center justify-between gap-2 p-4">
            <div><h3 className="break-all font-semibold text-ink-100">{state.option.apiModel}</h3><p className="text-sm text-ink-400">{state.option.effort}</p></div>
            <span className={`rounded px-2 py-1 text-xs ${state.status === "success" ? "bg-lime-benchlee/10 text-lime-benchlee" : state.status === "error" || state.status === "unavailable" ? "bg-amber-300/10 text-amber-300" : "bg-ink-800 text-ink-300"}`}>{state.status}</span>
          </div>
          {state.result ? <>
            <BenchmarkPreview result={state.result} />
            <div className="space-y-3 p-4">
              <BenchmarkTelemetry result={state.result} />
              <Link className="inline-block text-sm text-lime-benchlee hover:underline" href={`/benchmark/${state.result.id}`} target="_blank" rel="noreferrer">Open artifact & source ↗</Link>
            </div>
          </> : <div className="grid min-h-60 place-items-center bg-ink-950 p-6 text-center text-sm text-ink-400">{state.error ?? (state.status === "running" ? "Waiting for provider response…" : "Queued…")}</div>}
        </article>)}
      </div>
    </section>}
  </>;
}

export function BenchmarkPreview({ result }: { result: BenchmarkResult }) {
  return <ArtifactFrame key={result.id} publicId={result.id} src={`/api/benchmark/${result.id}/raw`} title={`${result.option.apiModel} · ${result.option.effort}`} viewportW={BENCHMARK_VIEWPORT.width} viewportH={BENCHMARK_VIEWPORT.height} interactive />;
}

export function BenchmarkTelemetry({ result }: { result: BenchmarkResult }) {
  return <p className="text-sm text-ink-300">{(result.latencyMs / 1000).toFixed(2)}s generation · {result.inputTokens ?? "Unknown"} input tokens · {result.outputTokens ?? "Unknown"} output tokens</p>;
}
