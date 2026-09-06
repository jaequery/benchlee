import type { Metadata } from "next";
import Link from "next/link";
import { categoryLabel, formatBytes, formatCost, formatMs } from "@/lib/brand";
import { entriesForTask, getTask, listTasks } from "@/lib/queries";
import { ArtifactFrame } from "@/components/ArtifactFrame";
import { ModelChip, ProvenanceBadge, SectionHeading, Stat } from "@/components/ui";
import { rubricAverage, type Entry, type Task } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Compare",
  description: "Two models, one brief, side by side at full size — labels on.",
};

type Search = { task?: string; a?: string; b?: string };

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const tasks = await listTasks();
  const task = sp.task ? await getTask(sp.task) : (tasks[0] ?? null);

  if (!task) {
    return (
      <EmptyState message="No benchmark results yet." />
    );
  }

  const entries = await entriesForTask(task.slug);
  const left =
    entries.find((e) => e.model.slug === sp.a) ?? entries[0] ?? null;
  const right =
    entries.find((e) => e.model.slug === sp.b) ??
    entries.find((e) => e.run_id !== left?.run_id) ??
    null;

  if (!left || !right) {
    return (
      <EmptyState message={`"${task.title}" needs two entries to compare.`} />
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-12 sm:px-6">
      <SectionHeading eyebrow={`Compare · ${categoryLabel(task.category)}`} title={task.title}>
        {task.summary}
      </SectionHeading>

      {/* model pickers */}
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <ModelSelector
          label="Left"
          task={task}
          entries={entries}
          selected={left}
          other={right}
          side="a"
        />
        <ModelSelector
          label="Right"
          task={task}
          entries={entries}
          selected={right}
          other={left}
          side="b"
        />
      </div>

      {/* the split view */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel entry={left} task={task} />
        <Panel entry={right} task={task} />
      </div>

      {/* difference table */}
      <details className="mt-12">
        <summary>Editorial scores &amp; run details</summary>

        <div className="mt-6 overflow-x-auto rounded-xl border border-ink-700 bg-ink-900">
          <table className="w-full min-w-[600px] text-base">
            <thead>
              <tr className="border-b border-ink-800 text-left">
                <th className="px-4 py-3 font-semibold text-ink-300">Dimension</th>
                <th className="px-4 py-3 font-semibold text-ink-200">
                  {left.model.name}
                </th>
                <th className="px-4 py-3 font-semibold text-ink-200">
                  {right.model.name}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800">
              {task.rubric.map((dim) => {
                const l = left.scores.find((s) => s.dimension === dim.key);
                const r = right.scores.find((s) => s.dimension === dim.key);
                const lv = l ? Number(l.value) : null;
                const rv = r ? Number(r.value) : null;
                return (
                  <tr key={dim.key}>
                    <td className="px-4 py-3 text-ink-300">{dim.label}</td>
                    <ScoreCell value={lv} rationale={l?.rationale ?? null} lead={lv !== null && rv !== null && lv > rv} />
                    <ScoreCell value={rv} rationale={r?.rationale ?? null} lead={lv !== null && rv !== null && rv > lv} />
                  </tr>
                );
              })}
              <tr className="bg-ink-850/50">
                <td className="px-4 py-3 font-semibold text-ink-200">Editorial average</td>
                <td className="tnum px-4 py-3 text-ink-100">
                  {rubricAverage(left.scores)?.toFixed(2) ?? "—"}
                </td>
                <td className="tnum px-4 py-3 text-ink-100">
                  {rubricAverage(right.scores)?.toFixed(2) ?? "—"}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-ink-300">Historical record</td>
                <td className="tnum px-4 py-3 text-ink-200">
                  {left.wins}–{left.losses}
                </td>
                <td className="tnum px-4 py-3 text-ink-200">
                  {right.wins}–{right.losses}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-ink-300">Latency</td>
                <td className="tnum px-4 py-3 text-ink-200">{formatMs(left.latency_ms)}</td>
                <td className="tnum px-4 py-3 text-ink-200">{formatMs(right.latency_ms)}</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-ink-300">Cost</td>
                <td className="tnum px-4 py-3 text-ink-200">{formatCost(left.cost_usd)}</td>
                <td className="tnum px-4 py-3 text-ink-200">{formatCost(right.cost_usd)}</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-ink-300">Artifact size</td>
                <td className="tnum px-4 py-3 text-ink-200">{formatBytes(left.byte_size)}</td>
                <td className="tnum px-4 py-3 text-ink-200">{formatBytes(right.byte_size)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>

      <div className="mt-10 flex flex-wrap gap-3">

        <Link
          href={`/tasks/${task.slug}`}
          className="rounded-lg border border-ink-600 px-4 py-2.5 text-base font-semibold text-ink-200 transition-colors hover:border-ink-500"
        >
          All outputs
        </Link>
      </div>

      <nav className="mt-12 border-t border-ink-800 pt-6">
        <div className="text-base text-ink-300">
          Switch benchmark
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {tasks.map((t) => (
            <Link
              key={t.id}
              href={`/compare?task=${t.slug}`}
              className={`rounded-lg border px-3.5 py-1.5 text-base transition-colors ${
                t.slug === task.slug
                  ? "border-lime-benchlee bg-lime-benchlee/10 text-lime-benchlee"
                  : "border-ink-700 bg-ink-900 text-ink-300 hover:border-ink-500"
              }`}
            >
              {t.title}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

function ModelSelector({
  label,
  task,
  entries,
  selected,
  other,
  side,
}: {
  label: string;
  task: Task;
  entries: Entry[];
  selected: Entry;
  other: Entry;
  side: "a" | "b";
}) {
  return (
    <details className="rounded-lg border border-ink-700 p-4">
      <summary>{label}: {selected.model.name}</summary>
      <div className="mt-3 flex flex-wrap gap-2">
        {entries.map((entry) => {
          const active = entry.run_id === selected.run_id;
          const href =
            side === "a"
              ? `/compare?task=${task.slug}&a=${entry.model.slug}&b=${other.model.slug}`
              : `/compare?task=${task.slug}&a=${other.model.slug}&b=${entry.model.slug}`;
          return (
            <Link
              key={entry.run_id}
              href={href}
              className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-base transition-colors ${
                active
                  ? "border-lime-benchlee bg-lime-benchlee/10 text-lime-benchlee"
                  : "border-ink-700 text-ink-300 hover:border-ink-500"
              }`}
            >
              {entry.model.name}
            </Link>
          );
        })}
      </div>
    </details>
  );
}

function Panel({ entry, task }: { entry: Entry; task: Task }) {
  return (
    <article className="overflow-hidden rounded-xl border border-ink-700 bg-ink-900">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-800 px-4 py-3">
        <ModelChip model={entry.model} href={`/models/${entry.model.slug}`} />
        <ProvenanceBadge provenance={entry.provenance} />
      </header>

      <ArtifactFrame
        publicId={entry.artifact_public_id}
        title={`${entry.model.name} — ${task.title}`}
        viewportW={task.viewport_w}
        viewportH={task.viewport_h}
        className="border-b border-ink-800"
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 px-4 py-4">
        <Stat label="Editorial" value={rubricAverage(entry.scores)?.toFixed(1) ?? "—"} />
        <Stat label="Historical record" value={`${entry.wins}–${entry.losses}`} />
        <Stat label="Latency" value={formatMs(entry.latency_ms)} />
        <Stat label="Cost" value={formatCost(entry.cost_usd)} />
      </div>

      <div className="border-t border-ink-800 px-4 py-3">
        <Link
          href={`/a/${entry.artifact_public_id}`}
          className="text-base font-semibold text-lime-benchlee hover:underline"
        >
          Inspect output →
        </Link>
      </div>
    </article>
  );
}

function ScoreCell({
  value,
  rationale,
  lead,
}: {
  value: number | null;
  rationale: string | null;
  lead: boolean;
}) {
  return (
    <td className="px-4 py-3 align-top">
      <span
        className={`tnum text-base ${lead ? "text-lime-benchlee" : "text-ink-200"}`}
      >
        {value === null ? "—" : value.toFixed(1)}
      </span>
      {rationale && (
        <span className="mt-1 block max-w-md text-base leading-relaxed text-ink-300">
          {rationale}
        </span>
      )}
    </td>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
      <h1 className="text-2xl font-semibold text-ink-100">Nothing to compare</h1>
      <p className="mt-3 text-base text-ink-300">{message}</p>
      <Link
        href="/tasks"
        className="mt-6 inline-block rounded-lg border border-ink-600 px-4 py-2 text-base text-ink-200 hover:border-lime-benchlee hover:text-lime-benchlee"
      >
        Browse benchmarks
      </Link>
    </div>
  );
}
