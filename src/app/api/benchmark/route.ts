import { randomUUID, timingSafeEqual } from "node:crypto";
import { benchmarkOptions, generateArtifact, publicOption } from "@/lib/benchmark";
import { validateBenchmarkInput } from "@/lib/benchmark-core";
import { saveBenchmarkResult } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const active = new Set<string>();

export async function POST(request: Request) {
  const secret = process.env.BENCHMARK_ACCESS_TOKEN;
  if (!secret) return Response.json({ error: "Benchmark execution is disabled. Configure BENCHMARK_ACCESS_TOKEN on the server." }, { status: 503 });
  const supplied = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  const expected = Buffer.from(secret);
  const actual = Buffer.from(supplied);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual))
    return Response.json({ error: "Enter a valid benchmark access token." }, { status: 401 });
  if (active.size >= 3) return Response.json({ error: "Three runs are already active. Try again after they finish." }, { status: 429 });

  let input;
  try {
    // Read incrementally so chunked requests cannot bypass the body limit.
    const reader = request.body?.getReader();
    if (!reader) throw new Error("Missing request body.");
    let size = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 85000) { await reader.cancel(); throw new Error("Request body is too large."); }
      chunks.push(value);
    }
    input = validateBenchmarkInput(JSON.parse(Buffer.concat(chunks).toString("utf8")), benchmarkOptions());
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Invalid request." }, { status: 400 });
  }
  if (!input.option.available) return Response.json({ error: "Provider credentials are not configured." }, { status: 503 });
  // Recheck after reading the body: concurrent readers may have filled the slots.
  if (active.size >= 3) return Response.json({ error: "Three runs are already active. Try again later." }, { status: 429 });
  const id = randomUUID();
  active.add(id);
  try {
    const output = await generateArtifact(input.prompt, input.option);
    const result = { id, prompt: input.prompt, option: publicOption(input.option), ...output };
    try { await saveBenchmarkResult(result); }
    catch { return Response.json({ error: "The provider responded, but the result could not be saved. Check database availability and migrations before retrying." }, { status: 500 }); }
    return Response.json(result, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Provider run failed." }, { status: 502 });
  } finally {
    active.delete(id);
  }
}
