import Link from "next/link";
import { ArtifactFrame } from "./ArtifactFrame";
import { ModelChip, ProvenanceBadge } from "./ui";
import { formatMs } from "@/lib/brand";
import { rubricAverage, type Entry, type Task } from "@/lib/types";

/** Original output first; details remain one click away. */
export function ArtifactCard({ entry, task }: {
  entry: Entry;
  task: Pick<Task, "viewport_w" | "viewport_h">;
}) {
  const avg = rubricAverage(entry.scores);
  return (
    <article className="min-w-0 overflow-hidden rounded-lg border border-ink-700">
      <Link href={`/a/${entry.artifact_public_id}`} className="block" aria-label={`Open ${entry.model.name}'s output`}>
        <ArtifactFrame publicId={entry.artifact_public_id} title={`${entry.model.name} — ${entry.task_title}`} viewportW={task.viewport_w} viewportH={task.viewport_h} />
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
        <ModelChip model={entry.model} href={`/models/${entry.model.slug}`} />
        <ProvenanceBadge provenance={entry.provenance} />
      </div>
      <div className="flex flex-wrap justify-between gap-3 px-4 pb-4 text-ink-300">
        <span>Editorial {avg?.toFixed(1) ?? "—"}/10 · {formatMs(entry.latency_ms)}</span>
        <Link href={`/a/${entry.artifact_public_id}`} className="text-lime-benchlee">Inspect →</Link>
      </div>
    </article>
  );
}
