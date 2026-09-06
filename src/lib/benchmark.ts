import "server-only";
import runtime from "../../db/seed/models.runtime.json";
import { configuredOptions, KEY_NAMES, providerOutput, providerRequest } from "./benchmark-core";
import type { ConfiguredOption } from "./benchmark-core";
import type { BenchmarkOption } from "./benchmark-types";

export function benchmarkOptions() {
  return configuredOptions(runtime, process.env);
}
export function publicOption(option: ConfiguredOption): BenchmarkOption {
  const { id, model, apiModel, provider, effort, available } = option;
  return { id, model, apiModel, provider, effort, available };
}

export async function generateArtifact(prompt: string, option: ConfiguredOption) {
  const key = process.env[KEY_NAMES[option.provider as keyof typeof KEY_NAMES]];
  if (!key) throw new Error("Provider credentials are not configured.");
  const request = providerRequest(option, prompt, key);
  const start = Date.now();
  let response: Response;
  try {
    response = await fetch(request.url, {
      method: "POST", headers: request.headers, body: JSON.stringify(request.body),
      signal: AbortSignal.timeout(120000), cache: "no-store",
    });
  } catch {
    throw new Error("Provider connection failed or exceeded the two-minute timeout.");
  }
  // Do not return upstream bodies: they may contain credentials or account details.
  if (!response.ok) throw new Error(`Provider returned HTTP ${response.status}.`);
  let data;
  try { data = await response.json(); }
  catch { throw new Error("Provider returned an unreadable response or timed out while sending it."); }
  const output = providerOutput(option.provider, data);
  return { ...output, latencyMs: Date.now() - start };
}
