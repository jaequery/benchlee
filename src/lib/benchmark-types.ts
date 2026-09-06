export type BenchmarkOption = {
  id: string;
  model: string;
  apiModel: string;
  provider: string;
  effort: string;
  available: boolean;
};

export type BenchmarkResult = {
  id: string;
  prompt: string;
  option: BenchmarkOption;
  content: string;
  latencyMs: number;
  inputTokens: number | null;
  outputTokens: number | null;
};

export type BenchmarkState = {
  option: BenchmarkOption;
  status: "pending" | "running" | "success" | "unavailable" | "error";
  result?: BenchmarkResult;
  error?: string;
};

export const BENCHMARK_VIEWPORT = { width: 1280, height: 800 };
