import { getBenchmarkResult } from "@/lib/queries";
import { ARTIFACT_CSP } from "@/lib/benchmark-core";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await getBenchmarkResult((await params).id);
  if (!result) return new Response("Artifact not found", { status: 404 });
  return new Response(result.content, { headers: {
    "content-type": "text/html; charset=utf-8",
    "content-security-policy": ARTIFACT_CSP,
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
    "cache-control": "private, no-store",
  } });
}
