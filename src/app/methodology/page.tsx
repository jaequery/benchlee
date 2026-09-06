import type { Metadata } from "next";
import Link from "next/link";
import { listTasks, siteStats } from "@/lib/queries";
import { DemoDataNotice, SectionHeading } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Method",
  description: "What the results show, where the data comes from, and benchmark limitations.",
};

export default async function MethodologyPage() {
  const [tasks, stats] = await Promise.all([listTasks(), siteStats()]);
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <SectionHeading title="How to read the results">
        Original outputs. Traceable scores.
      </SectionHeading>
      <div className="mt-12 space-y-10">
        <section id="data" className="scroll-mt-24">
          <h2>Data &amp; provenance</h2>
          <p className="mt-4 text-ink-300">{stats.artifacts} artifacts · {stats.models} models · {stats.live_runs} live provider runs.</p>
          {stats.live_runs === 0 && <div className="mt-4"><DemoDataNotice /></div>}
          <p className="mt-4 text-ink-300"><strong>Demo</strong> artifacts are hand-authored fixtures, not provider responses. <strong>Live run</strong> marks real provider output and telemetry.</p>
        </section>
        <section id="limits" className="scroll-mt-24">
          <h2>Limits</h2>
          <p className="mt-4 text-ink-300">The curated suite contains {tasks.length} single-turn front-end briefs. It does not measure reasoning, long-context recall, tool use, factual accuracy, safety, or multi-turn work.</p>
          <p className="mt-4 text-ink-300">One generation per model and task, at non-zero temperature, is weak evidence. A rerun can differ. Results do not establish general model quality.</p>
        </section>
        <details>
          <summary>Outputs &amp; prompts</summary>
          <p className="mt-4 text-ink-300">Artifacts are stored unchanged and rendered at each benchmark’s fixed viewport. Broken output stays broken. Sandboxed frames cannot access the site’s origin or network.</p>
          <p className="mt-4 text-ink-300">The curated runner sends the same prompt and temperature to each model, without a system prompt or retries. Full prompts are available on benchmark pages.</p>
          <ul className="mt-4 space-y-2">{tasks.map((task) => <li key={task.id}><Link href={`/tasks/${task.slug}`} className="text-lime-benchlee">{task.title}</Link></li>)}</ul>
        </details>
        <details>
          <summary>Editorial scores &amp; historical standings</summary>
          <p className="mt-4 text-ink-300">Editorial scores are 0–10 judgments with written rationales. Each score is traceable to an artifact and run.</p>
          <p className="mt-4 text-ink-300">Historical standings use head-to-head win rate, with editorial averages breaking ties. The two signals are never blended. Seeded ballots are included; community turnout is reported separately.</p>
          <p className="mt-4 text-ink-300">Past visitor votes used anonymous cookies without aggressive deduplication. They are a preference signal, not a representative sample. Voting is now closed.</p>
        </details>
        <details>
          <summary>Saved custom results</summary>
          <p className="mt-4 text-ink-300">Saved custom runs remain viewable by their result URLs, separately from curated standings. Public run submission is closed.</p>
          <p className="mt-4 text-ink-300">Their exact prompts and raw responses are preserved, including markdown fences and malformed HTML. Previews use a shared 1280 × 800 viewport. Effort settings differ by provider.</p>
          <p className="mt-4 text-ink-300">Latency covers the provider request and response, excluding queue and storage time. Token counts include thinking tokens where reported; missing counts stay unknown. Single runs do not establish a reliable quality ranking.</p>
        </details>
      </div>
    </div>
  );
}
