import type { Metadata } from "next";
import { BenchmarkBoard } from "@/components/BenchmarkBoard";
import { benchmarkOptions, publicOption } from "@/lib/benchmark";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Run a prompt", description: "Compare artifacts from the same prompt across models and effort levels." };
export default function BenchmarkPage() {
  return <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
    <p className="text-sm text-lime-benchlee">Your prompt. Every perspective.</p>
    <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink-100">Run a benchmark</h1>
    <p className="mt-4 max-w-2xl text-ink-400">Pick the models and effort levels, then compare what they make side by side. Each artifact renders at the same 1280 × 800 viewport. Custom runs stay separate from the curated leaderboard.</p>
    <BenchmarkBoard options={benchmarkOptions().map(publicOption)} enabled={Boolean(process.env.BENCHMARK_ACCESS_TOKEN)} />
  </div>;
}
