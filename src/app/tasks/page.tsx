import type { Metadata } from "next";
import Link from "next/link";
import { categoryLabel } from "@/lib/brand";
import { entriesForTask, listTasks } from "@/lib/queries";
import { ArtifactFrame } from "@/components/ArtifactFrame";
import { ProvenanceBadge, SectionHeading } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Benchmarks",
  description:
    "Every Benchlee benchmark, and the artifacts each model produced for it.",
};

export default async function TasksPage() {
  const tasks = await listTasks();
  const withEntries = await Promise.all(
    tasks.map(async (task) => ({
      task,
      entries: (await entriesForTask(task.slug)).slice(0, 4),
    })),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <SectionHeading eyebrow="The suite" title="Benchmarks">
        Compare model outputs for each brief.
      </SectionHeading>

      <div className="mt-10 space-y-10">
        {withEntries.map(({ task, entries }) => (
          <section
            key={task.id}
            className="overflow-hidden rounded-xl border border-ink-700 bg-ink-900"
          >
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink-800 p-5">
              <div className="max-w-2xl">
                <span className="text-base text-lime-benchlee">
                  {categoryLabel(task.category)}
                </span>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-ink-100">
                  <Link
                    href={`/tasks/${task.slug}`}
                    className="hover:text-lime-benchlee"
                  >
                    {task.title}
                  </Link>
                </h2>
                <p className="mt-2 text-base leading-relaxed text-ink-300">
                  {task.summary}
                </p>
              </div>
              <Link
                href={`/tasks/${task.slug}`}
                className="rounded-lg border border-ink-600 px-4 py-2 text-base font-semibold text-ink-200 transition-colors hover:border-lime-benchlee hover:text-lime-benchlee"
              >
                Compare →
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {entries.map((entry) => (
                <Link
                  key={entry.run_id}
                  href={`/a/${entry.artifact_public_id}`}
                  className="group relative block bg-ink-900"
                >
                  <ArtifactFrame
                    publicId={entry.artifact_public_id}
                    title={`${entry.model.name} — ${task.title}`}
                    viewportW={task.viewport_w}
                    viewportH={task.viewport_h}
                  />
                  <span className="flex flex-wrap items-center justify-between gap-2 px-3 py-3 text-base font-semibold text-ink-100">
                    {entry.model.name}
                    <ProvenanceBadge provenance={entry.provenance} />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
