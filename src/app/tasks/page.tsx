import type { Metadata } from "next";
import Link from "next/link";
import { categoryLabel } from "@/lib/brand";
import { entriesForTask, listTasks } from "@/lib/queries";
import { ArtifactFrame } from "@/components/ArtifactFrame";
import { SectionHeading } from "@/components/ui";

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
        Each brief is written to produce something renderable, and to be losable
        in a way a unit test would shrug at. Open one to see every model&apos;s
        answer side by side.
      </SectionHeading>

      <div className="mt-10 space-y-10">
        {withEntries.map(({ task, entries }) => (
          <section
            key={task.id}
            className="overflow-hidden rounded-xl border border-ink-700 bg-ink-900"
          >
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink-800 p-5">
              <div className="max-w-2xl">
                <span className="text-[11px] uppercase tracking-[0.14em] text-lime-benchlee">
                  {categoryLabel(task.category)}
                </span>
                <h2 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-ink-100">
                  <Link
                    href={`/tasks/${task.slug}`}
                    className="hover:text-lime-benchlee"
                  >
                    {task.title}
                  </Link>
                </h2>
                <p className="mt-2 text-[14.5px] leading-relaxed text-ink-400">
                  {task.summary}
                </p>
              </div>
              <Link
                href={`/tasks/${task.slug}`}
                className="rounded-lg border border-ink-600 px-4 py-2 text-[13.5px] font-medium text-ink-200 transition-colors hover:border-lime-benchlee hover:text-lime-benchlee"
              >
                Compare →
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-px bg-ink-800 lg:grid-cols-4">
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
                  <span className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-md bg-ink-950/85 px-2 py-1 text-[11px] font-medium text-ink-100 backdrop-blur-sm">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: entry.model.accent_hex }}
                    />
                    {entry.model.name}
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
