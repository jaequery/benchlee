import type { BenchmarkOption, BenchmarkResult, BenchmarkState } from "./benchmark-types";

export type Wiring = {
  provider: "anthropic" | "openai" | "google";
  api_model: string;
  benchmark_efforts?: { id: string; label: string; parameters: Record<string, unknown> }[];
};
export type ConfiguredOption = BenchmarkOption & { parameters: Record<string, unknown> };
export const KEY_NAMES = { anthropic: "ANTHROPIC_API_KEY", openai: "OPENAI_API_KEY", google: "GOOGLE_API_KEY" };

export function configuredOptions(
  runtime: Record<string, unknown>,
  env: Record<string, string | undefined>,
): ConfiguredOption[] {
  return Object.entries(runtime).flatMap(([slug, value]) => {
    if (slug.startsWith("$") || !value || typeof value !== "object") return [];
    const wiring = value as Wiring;
    if (!Object.hasOwn(KEY_NAMES, wiring.provider) || !wiring.api_model) return [];
    return (wiring.benchmark_efforts ?? [{ id: "default", label: "Provider default", parameters: {} }]).map((effort) => ({
      id: `${slug}:${effort.id}`, model: slug, apiModel: wiring.api_model,
      provider: wiring.provider, effort: effort.label, parameters: effort.parameters,
      available: Boolean(env[KEY_NAMES[wiring.provider]]),
    }));
  });
}

export function validateBenchmarkInput(body: unknown, options: ConfiguredOption[]) {
  if (!body || typeof body !== "object") throw new Error("Expected a prompt and model/effort selection.");
  const { prompt, optionId } = body as Record<string, unknown>;
  if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 20000)
    throw new Error("Enter a prompt between 1 and 20,000 characters.");
  const option = options.find((o) => o.id === optionId);
  if (!option) throw new Error("Unknown model/effort selection.");
  return { prompt, option };
}

export function providerRequest(option: ConfiguredOption, prompt: string, key: string) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  let url: string;
  let body: Record<string, unknown>;
  if (option.provider === "anthropic") {
    url = "https://api.anthropic.com/v1/messages";
    headers["x-api-key"] = key;
    headers["anthropic-version"] = "2023-06-01";
    body = { ...option.parameters, model: option.apiModel, max_tokens: 8000, messages: [{ role: "user", content: prompt }] };
  } else if (option.provider === "openai") {
    url = "https://api.openai.com/v1/chat/completions";
    headers.authorization = `Bearer ${key}`;
    body = { ...option.parameters, model: option.apiModel, max_completion_tokens: 8000, messages: [{ role: "user", content: prompt }] };
  } else {
    url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(option.apiModel)}:generateContent`;
    headers["x-goog-api-key"] = key;
    body = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { ...option.parameters, maxOutputTokens: 16000 } };
  }
  return { url, headers, body };
}

type ProviderResponse = {
  content?: { type: string; text?: string }[];
  usage?: { input_tokens?: number; output_tokens?: number; prompt_tokens?: number; completion_tokens?: number };
  choices?: { message?: { content?: string } }[];
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number };
};
const tokens = (n: unknown) => typeof n === "number" && Number.isInteger(n) && n >= 0 ? n : null;
export function providerOutput(provider: string, data: ProviderResponse) {
  let content: string;
  let inputTokens: number | null;
  let outputTokens: number | null;
  if (provider === "anthropic") {
    content = (data.content ?? []).filter((p) => p.type === "text").map((p) => p.text ?? "").join("");
    inputTokens = tokens(data.usage?.input_tokens);
    outputTokens = tokens(data.usage?.output_tokens);
  } else if (provider === "openai") {
    content = data.choices?.[0]?.message?.content ?? "";
    inputTokens = tokens(data.usage?.prompt_tokens);
    outputTokens = tokens(data.usage?.completion_tokens);
  } else {
    content = (data.candidates?.[0]?.content?.parts ?? []).filter((p) => !p.thought).map((p) => p.text ?? "").join("");
    inputTokens = tokens(data.usageMetadata?.promptTokenCount);
    const visible = tokens(data.usageMetadata?.candidatesTokenCount);
    const thinking = tokens(data.usageMetadata?.thoughtsTokenCount);
    outputTokens = visible === null ? null : visible + (thinking ?? 0);
  }
  if (!content.trim()) throw new Error("Provider returned no artifact content (possibly a refusal).");
  if (content.length > 1000000) throw new Error("Provider artifact exceeds the 1 MB character limit.");
  return { content, inputTokens, outputTokens };
}

/** Three workers keep large comparisons bounded; every result is independent. */
export async function runComparison(
  prompt: string,
  options: BenchmarkOption[],
  execute: (prompt: string, option: BenchmarkOption) => Promise<BenchmarkResult>,
  update: (state: BenchmarkState) => void,
) {
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(3, options.length) }, async () => {
    while (next < options.length) {
      const option = options[next++];
      if (!option.available) {
        update({ option, status: "unavailable", error: "Provider credentials are not configured." });
        continue;
      }
      update({ option, status: "running" });
      try {
        update({ option, status: "success", result: await execute(prompt, option) });
      } catch (error) {
        update({ option, status: "error", error: error instanceof Error ? error.message : "Run failed." });
      }
    }
  }));
}

export const ARTIFACT_CSP = "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; font-src data:; form-action 'none'; base-uri 'none'; sandbox allow-scripts";
