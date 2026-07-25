import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  artifactContent,
  entriesForTask,
  entryByArtifactPublicId,
  getTask,
} from "@/lib/queries";
import { ArtifactFrame } from "@/components/ArtifactFrame";
import { ModelChip, ProvenanceBadge, SectionHeading, Stat } from "@/components/ui";
import {
  categoryLabel,
  formatBytes,
  formatCost,
  formatMs,
} from "@/lib/brand";
import { rubricAverage } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const entry = await entryByArtifactPublicId(id);
  if (!entry) return { title: "Artifact not found" };
  const title = `${entry.model.name} — ${entry.task_title}`;
  return {
    title,
    description: `What ${entry.model.name} actually built for "${entry.task_title}", rendered live on Benchlee.`,
    openGraph: {
      title,
      description: `What ${entry.model.name} actually built, rendered live.`,
      images: [{ url: `/a/${id}/opengraph-image` }],
    },
  };
}

export default async function ArtifactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entry = await entryByArtifactPublicId(id);
  if (!entry) notFound();

  const [task, source] = await Promise.all([
    getTask(entry.task_slug),
    artifactContent(id),
  ]);
  if (!task) notFound();

  const siblings = (await entriesForTask(task.slug)).filter(
    (e) => e.run_id !== entry.run_id,
  );
  const avg = rubricAverage(entry.scores);
  const lineCount = source?.content.split("\n").length ?? 0;

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-10 sm:px-6">
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-[13px] text-ink-400">
        <Link href="/tasks" className="hover:text-lime-benchlee">
          Benchmarks
        </Link>
        <span aria-hidden="true">/</span>
        <Link href={`/tasks/${task.slug}`} className="hover:text-lime-benchlee">
          {task.title}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-ink-200">{entry.model.name}</span>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-2xl">
          <span className="text-[11px] uppercase tracking-[0.16em] text-lime-benchlee">
            {categoryLabel(task.category)} · artifact
          </span>
          <h1 className="mt-2 text-balance text-[32px] font-semibold leading-[1.1] tracking-[-0.03em] text-ink-100 sm:text-[40px]">
            {entry.model.name} × {task.title}
          </h1>
          <p className="mt-3 text-[15.5px] leading-relaxed text-ink-400">
            Rendered live in a sandboxed frame with no network access. This is
            the file, running — not a screenshot of it.
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
          <ProvenanceBadge provenance={entry.provenance} />
          <ModelChip model={entry.model} href={`/models/${entry.model.slug}`} />
        </div>
      </header>

      {/* the artifact, full size and interactive */}
      <div className="mt-8 overflow-hidden rounded-xl border border-ink-700 bg-ink-900">
        <div className="flex items-center justify-between gap-3 border-b border-ink-800 px-4 py-2.5">
          <span className="font-mono text-[12.5px] text-ink-400">
            {entry.artifact_title}
          </span>
          <span className="tnum text-[11.5px] text-ink-500">
            {task.viewport_w}×{task.viewport_h} · {formatBytes(entry.byte_size)}
            {lineCount > 0 && ` · ${lineCount} lines`}
          </span>
        </div>
        <ArtifactFrame
          publicId={entry.artifact_public_id}
          title={`${entry.model.name} — ${task.title}`}
          viewportW={task.viewport_w}
          viewportH={task.viewport_h}
          interactive
        />
        <div className="flex flex-wrap items-center gap-3 border-t border-ink-800 px-4 py-3">
          <a
            href={`/api/artifacts/${entry.artifact_public_id}/raw`}
            target="_blank"
            rel="noreferrer noopener"
            className="text-[13px] font-medium text-lime-benchlee hover:underline"
          >
            Open raw in a new tab ↗
          </a>
          <span className="text-ink-700">·</span>
          <span className="text-[13px] text-ink-500">
            The frame above is fully interactive — hover it.
          </span>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* telemetry */}
        <aside className="space-y-6">
          <div className="rounded-xl border border-ink-700 bg-ink-900 p-5">
            <div className="text-[11px] uppercase tracking-[0.14em] text-ink-500">
              Run telemetry
            </div>
            <div className="mt-4 grid grid-cols-2 gap-5">
              <Stat label="Rubric avg" value={avg?.toFixed(2) ?? "—"} />
              <Stat label="Head to head" value={`${entry.wins}–${entry.losses}`} />
              <Stat label="Latency" value={formatMs(entry.latency_ms)} />
              <Stat label="Cost" value={formatCost(entry.cost_usd)} />
              <Stat label="Out tokens" value={String(entry.output_tokens ?? "—")} />
              <Stat label="Size" value={formatBytes(entry.byte_size)} />
            </div>
            <p className="mt-5 border-t border-ink-800 pt-4 text-[12px] leading-relaxed text-ink-500">
              Ran {new Date(entry.ran_at).toISOString().slice(0, 16).replace("T", " ")} UTC
              · run <span className="font-mono">{entry.run_public_id}</span>
            </p>
          </div>

          {entry.scores.length > 0 && (
            <div className="rounded-xl border border-ink-700 bg-ink-900 p-5">
              <div className="text-[11px] uppercase tracking-[0.14em] text-ink-500">
                Editorial rubric
              </div>
              <ul className="mt-4 space-y-4">
                {entry.scores.map((s) => {
                  const dim = task.rubric.find((d) => d.key === s.dimension);
                  return (
                    <li key={s.dimension}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-[13.5px] text-ink-200">
                          {dim?.label ?? s.dimension}
                        </span>
                        <span className="tnum text-[13.5px] text-lime-benchlee">
                          {Number(s.value).toFixed(1)}
                        </span>
                      </div>
                      <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-ink-800">
                        <span
                          className="block h-full rounded-full bg-lime-benchlee/70"
                          style={{ width: `${(Number(s.value) / 10) * 100}%` }}
                        />
                      </span>
                      {s.rationale && (
                        <p className="mt-2 text-[12.5px] leading-relaxed text-ink-500">
                          {s.rationale}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </aside>

        {/* prompt + source */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-ink-700 bg-ink-900 p-5">
            <div className="text-[11px] uppercase tracking-[0.14em] text-ink-500">
              The prompt it was given
            </div>
            <p className="mt-3 font-mono text-[13.5px] leading-relaxed text-ink-200">
              {task.prompt}
            </p>
          </div>

          {source && (
            <details className="group rounded-xl border border-ink-700 bg-ink-900">
              <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4 text-[13.5px] font-medium text-ink-200 marker:content-none">
                <span>
                  Read the source it wrote
                  <span className="ml-2 tnum text-[12px] text-ink-500">
                    {lineCount} lines
                  </span>
                </span>
                <span className="text-ink-500 transition-transform group-open:rotate-180">
                  ▾
                </span>
              </summary>
              <pre className="max-h-[560px] overflow-auto border-t border-ink-800 bg-ink-950 px-5 py-4 font-mono text-[12px] leading-relaxed text-ink-300">
                <code>{source.content}</code>
              </pre>
            </details>
          )}
        </div>
      </div>

      {siblings.length > 0 && (
        <section className="mt-16">
          <SectionHeading title="The same brief, other models">
            The comparison is the product. Put this one next to any of them.
          </SectionHeading>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {siblings.map((other) => (
              <Link
                key={other.run_id}
                href={`/compare?task=${task.slug}&a=${entry.model.slug}&b=${other.model.slug}`}
                className="group overflow-hidden rounded-xl border border-ink-700 bg-ink-900 transition-colors hover:border-lime-benchlee/50"
              >
                <ArtifactFrame
                  publicId={other.artifact_public_id}
                  title={`${other.model.name} — ${task.title}`}
                  viewportW={task.viewport_w}
                  viewportH={task.viewport_h}
                  className="border-b border-ink-800"
                />
                <div className="flex items-center justify-between gap-2 px-3.5 py-2.5">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: other.model.accent_hex }}
                    />
                    <span className="truncate text-[12.5px] text-ink-200">
                      {other.model.name}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11.5px] text-ink-500 group-hover:text-lime-benchlee">
                    vs →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
