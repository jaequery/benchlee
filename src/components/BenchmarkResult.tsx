import { ArtifactFrame } from "./ArtifactFrame";
import { BENCHMARK_VIEWPORT, type BenchmarkResult } from "@/lib/benchmark-types";

export function BenchmarkPreview({ result }: { result: BenchmarkResult }) {
  return <ArtifactFrame key={result.id} publicId={result.id} src={`/api/benchmark/${result.id}/raw`} title={`${result.option.apiModel} · ${result.option.effort}`} viewportW={BENCHMARK_VIEWPORT.width} viewportH={BENCHMARK_VIEWPORT.height} interactive />;
}

export function BenchmarkTelemetry({ result }: { result: BenchmarkResult }) {
  return <p className="text-base text-ink-300">{(result.latencyMs / 1000).toFixed(2)}s generation · {result.inputTokens ?? "Unknown"} input tokens · {result.outputTokens ?? "Unknown"} output tokens</p>;
}
