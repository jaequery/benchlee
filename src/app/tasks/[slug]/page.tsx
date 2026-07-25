import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { categoryLabel } from "@/lib/brand";
import { entriesForTask, getTask, listTasks } from "@/lib/queries";
import { ArtifactCard } from "@/components/ArtifactCard";
import { DemoDataNotice, SectionHeading } from "@/components/ui";
import { rubricAverage } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const task = await getTask(slug);
  if (!task) return { title: "Benchmark not found" };
  return {
    title: task.title,
    description: task.summary,
    openGraph: {
      title: `${task.title} — every model's answer`,
      description: task.summary,
      images: [{ url: `/tasks/${task.slug}/opengraph-image` }],
    },
  };
}

export default async function TaskPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [task, allTasks] = await Promise.all([getTask(slug), listTasks()]);
  if (!task) notFound();

  const entries = await entriesForTask(task.slug);
  const anyDemo = entries.some((e) => e.provenance === "demo");

  // Ordered by the rubric so the gallery reads best-to-worst, but the artifact
  // is still what you compare — the ranking is just the reading order.
  const ranked = [...entries].sort(
    (a, b) => (rubricAverage(b.scores) ?? 0) - (rubricAverage(a.scores) ?? 0),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <nav className="mb-6 flex items-center gap-2 text-[13px] text-ink-400">
        <Link href="/tasks" className="hover:text-lime-benchlee">
          Benchmarks
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-ink-200">{task.title}</span>
      </nav>

      <header className="max-w-3xl">
        <span className="text-[11px] uppercase tracking-[0.16em] text-lime-benchlee">
          {categoryLabel(task.category)} · {task.viewport_w}×{task.viewport_h}
        </span>
        <h1 className="mt-3 text-balance text-[36px] font-semibold leading-[1.08] tracking-[-0.03em] text-ink-100 sm:text-[46px]">
          {task.title}
        </h1>
        <p className="mt-4 text-[17px] leading-relaxed text-ink-300">
          {task.summary}
        </p>
      </header>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-ink-700 bg-ink-900 p-5">
            <div className="text-[11px] uppercase tracking-[0.14em] text-ink-500">
              The prompt, verbatim
            </div>
            <p className="mt-3 font-mono text-[13.5px] leading-relaxed text-ink-200">
              {task.prompt}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-ink-700 bg-ink-900 p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-ink-500">
            Why this one
          </div>
          <p className="mt-3 text-[14px] leading-relaxed text-ink-300">
            {task.why_it_matters}
          </p>
        </div>
      </div>

      {anyDemo && (
        <div className="mt-6">
          <DemoDataNotice />
        </div>
      )}

      <div className="mt-12 flex flex-wrap items-end justify-between gap-4">
        <SectionHeading title={`${entries.length} models, one brief`}>
          Every artifact below renders live at {task.viewport_w}×
          {task.viewport_h}. Scroll them against each other; the scores are
          underneath if you want them.
        </SectionHeading>
        <Link
          href={`/arena?task=${task.slug}`}
          className="rounded-lg bg-lime-benchlee px-4 py-2 text-[13.5px] font-semibold text-ink-950 transition-colors hover:bg-lime-dim"
        >
          Vote on these blind →
        </Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {ranked.map((entry) => (
          <ArtifactCard key={entry.run_id} entry={entry} task={task} />
        ))}
      </div>

      {entries.length >= 2 && (
        <section className="mt-16">
          <SectionHeading eyebrow="Head to head" title="Pick any two">
            Put two entries in a split view and judge them at full size.
          </SectionHeading>
          <div className="mt-6 flex flex-wrap gap-2">
            {entries.slice(0, -1).map((left, i) =>
              entries.slice(i + 1).map((right) => (
                <Link
                  key={`${left.run_id}-${right.run_id}`}
                  href={`/compare?task=${task.slug}&a=${left.model.slug}&b=${right.model.slug}`}
                  className="rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-[12.5px] text-ink-300 transition-colors hover:border-lime-benchlee hover:text-lime-benchlee"
                >
                  {left.model.name} <span className="text-ink-500">vs</span>{" "}
                  {right.model.name}
                </Link>
              )),
            )}
          </div>
        </section>
      )}

      <nav className="mt-16 border-t border-ink-800 pt-8">
        <div className="text-[11px] uppercase tracking-[0.14em] text-ink-500">
          Other benchmarks
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {allTasks
            .filter((t) => t.slug !== task.slug)
            .map((t) => (
              <Link
                key={t.id}
                href={`/tasks/${t.slug}`}
                className="rounded-lg border border-ink-700 bg-ink-900 px-4 py-2 text-[13.5px] text-ink-200 transition-colors hover:border-lime-benchlee hover:text-lime-benchlee"
              >
                {t.title}
              </Link>
            ))}
        </div>
      </nav>
    </div>
  );
}
