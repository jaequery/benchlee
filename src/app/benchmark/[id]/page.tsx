import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBenchmarkResult } from "@/lib/queries";
import { BenchmarkPreview, BenchmarkTelemetry } from "@/components/BenchmarkBoard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Custom benchmark result", robots: { index: false, follow: false } };
export default async function BenchmarkResultPage({ params }: { params: Promise<{ id: string }> }) {
  const result = await getBenchmarkResult((await params).id);
  if (!result) notFound();
  return <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
    <Link href="/benchmark" className="text-sm text-lime-benchlee">← Run another comparison</Link>
    <h1 className="mt-5 break-all text-3xl font-semibold text-ink-100">{result.option.apiModel}</h1>
    <p className="my-3 text-ink-400">{result.option.provider} · {result.option.effort} · Live custom run</p>
    <BenchmarkPreview result={result} />
    <div className="my-5"><BenchmarkTelemetry result={result} /></div>
    <p className="break-all text-xs text-ink-500">Run {result.id} · outside curated rankings</p>
    <details className="mt-6 rounded-lg border border-ink-700 p-4" open><summary className="cursor-pointer font-semibold">Prompt</summary><pre className="mt-3 whitespace-pre-wrap break-words text-sm text-ink-300">{result.prompt}</pre></details>
    <details className="mt-4 rounded-lg border border-ink-700 p-4"><summary className="cursor-pointer font-semibold">Verbatim artifact source</summary><pre className="mt-3 max-h-[600px] overflow-auto whitespace-pre-wrap break-words text-sm text-ink-300">{result.content}</pre></details>
  </div>;
}
