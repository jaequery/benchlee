import Link from "next/link";
import { categoryLabel } from "@/lib/brand";
import { entriesForTask, listTasks, siteStats } from "@/lib/queries";
import { ArtifactFrame } from "@/components/ArtifactFrame";
import { ModelChip, ProvenanceBadge, SectionHeading } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [tasks, stats] = await Promise.all([
    listTasks(),
    siteStats(),
  ]);

  const featured = tasks[0] ?? null;
  const featuredEntries = featured ? await entriesForTask(featured.slug) : [];
  const showcase = featuredEntries.slice(0, 3);

  return (
    <>
      {/* ---------------- hero ---------------- */}
      <section className="relative">
        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-12 sm:px-6 sm:pb-12 sm:pt-16">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 text-base text-ink-300">
              {stats.artifacts} artifacts · {stats.models} models ·{" "}
              {stats.tasks} benchmarks
            </span>

            <h1 className="mt-6 text-balance text-[40px] font-semibold leading-tight text-ink-100">
              See what models build.
            </h1>
            <p className="mt-6 text-ink-300">Benchmark outputs, side by side.</p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/tasks"
                className="rounded-lg bg-lime-benchlee px-5 py-2.5 text-base font-semibold text-ink-950 transition-colors hover:bg-lime-dim"
              >
                View results →
              </Link>

            </div>
          </div>
        </div>
      </section>

      {/* ---------------- featured side-by-side ---------------- */}
      {featured && showcase.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              eyebrow={`Benchmark · ${categoryLabel(featured.category)}`}
              title={featured.title}
            />
            <Link
              href={`/tasks/${featured.slug}`}
              className="rounded-lg border border-ink-600 px-4 py-2 text-base font-semibold text-ink-200 transition-colors hover:border-lime-benchlee hover:text-lime-benchlee"
            >
              All {featuredEntries.length} entries →
            </Link>
          </div>

          <details className="mt-6">
            <summary>View prompt</summary>
            <p className="mt-4 font-mono text-ink-300">{featured.prompt}</p>
          </details>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {showcase.map((entry) => (
              <figure
                key={entry.run_id}
                className="overflow-hidden rounded-xl border border-ink-700 bg-ink-900"
              >
                <Link href={`/a/${entry.artifact_public_id}`} className="block" aria-label={`Inspect ${entry.model.name}'s output`}>
                <ArtifactFrame
                  publicId={entry.artifact_public_id}
                  title={`${entry.model.name} — ${featured.title}`}
                  viewportW={featured.viewport_w}
                  viewportH={featured.viewport_h}
                  className="border-b border-ink-800"
                />
                </Link>
                <figcaption className="flex items-center justify-between gap-3 px-4 py-3">
                  <ModelChip
                    model={entry.model}
                    size="sm"
                    href={`/models/${entry.model.slug}`}
                  />
                  <ProvenanceBadge provenance={entry.provenance} />
                </figcaption>
              </figure>
            ))}
          </div>

        </section>
      )}

      {/* ---------------- task index ---------------- */}
      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6">
        <SectionHeading title="Benchmarks" />

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {tasks.map((task) => (
            <Link
              key={task.id}
              href={`/tasks/${task.slug}`}
              className="group rounded-xl border border-ink-700 bg-ink-900 p-5 transition-colors hover:border-lime-benchlee/50"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-base text-lime-benchlee">
                  {categoryLabel(task.category)}
                </span>
                <span className="text-base text-ink-300">
                  {task.viewport_w}×{task.viewport_h}
                </span>
              </div>
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.015em] text-ink-100 group-hover:text-lime-benchlee">
                {task.title}
              </h3>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
