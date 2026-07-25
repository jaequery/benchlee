import Link from "next/link";
import { ArtifactFrame } from "./ArtifactFrame";
import { ModelChip, ProvenanceBadge } from "./ui";
import { formatBytes, formatCost, formatMs } from "@/lib/brand";
import { rubricAverage, type Entry, type Task } from "@/lib/types";

/**
 * One model's answer to one task. The artifact is the headline; the numbers sit
 * underneath in a footer strip, which is the visual grammar of the whole site —
 * proof first, telemetry second.
 */
export function ArtifactCard({
  entry,
  task,
  blind = false,
  showScores = true,
}: {
  entry: Entry;
  task: Pick<Task, "viewport_w" | "viewport_h">;
  blind?: boolean;
  showScores?: boolean;
}) {
  const avg = rubricAverage(entry.scores);
  const record = entry.wins + entry.losses;

  return (
    <article className="group overflow-hidden rounded-xl border border-ink-700 bg-ink-900 transition-colors hover:border-ink-600">
      <header className="flex items-center justify-between gap-3 border-b border-ink-800 px-4 py-3">
        {blind ? (
          <span className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-md bg-ink-700 text-[11px] font-bold text-ink-300">
              ?
            </span>
            <span className="text-sm font-medium text-ink-300">
              Hidden until you vote
            </span>
          </span>
        ) : (
          <ModelChip model={entry.model} href={`/models/${entry.model.slug}`} />
        )}
        {!blind && <ProvenanceBadge provenance={entry.provenance} />}
      </header>

      <Link
        href={`/a/${entry.artifact_public_id}`}
        className="block"
        aria-label={`Open ${blind ? "artifact" : entry.model.name}'s artifact full size`}
        tabIndex={blind ? -1 : undefined}
      >
        <ArtifactFrame
          publicId={entry.artifact_public_id}
          title={
            blind
              ? `Artifact for ${entry.task_title}`
              : `${entry.model.name} — ${entry.task_title}`
          }
          viewportW={task.viewport_w}
          viewportH={task.viewport_h}
          className="border-b border-ink-800"
        />
      </Link>

      {!blind && (
        <footer className="grid grid-cols-4 gap-2 px-4 py-3 text-[12px]">
          <Cell label="Rubric" value={avg === null ? "—" : `${avg.toFixed(1)}`} />
          <Cell
            label="H2H"
            value={record === 0 ? "—" : `${entry.wins}–${entry.losses}`}
          />
          <Cell label="Latency" value={formatMs(entry.latency_ms)} />
          <Cell label="Size" value={formatBytes(entry.byte_size)} />
        </footer>
      )}

      {!blind && showScores && entry.scores.length > 0 && (
        <div className="border-t border-ink-800 px-4 py-3">
          <ul className="space-y-1.5">
            {entry.scores.map((s) => (
              <li key={s.dimension} className="flex items-center gap-3">
                <span className="w-24 shrink-0 truncate text-[11.5px] capitalize text-ink-400">
                  {s.dimension}
                </span>
                <span className="h-1 flex-1 overflow-hidden rounded-full bg-ink-800">
                  <span
                    className="block h-full rounded-full bg-lime-benchlee/70"
                    style={{ width: `${(Number(s.value) / 10) * 100}%` }}
                  />
                </span>
                <span className="tnum w-8 shrink-0 text-right text-[11.5px] text-ink-300">
                  {Number(s.value).toFixed(1)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!blind && (
        <div className="flex items-center justify-between gap-2 border-t border-ink-800 px-4 py-2.5">
          <span className="tnum text-[11.5px] text-ink-500">
            {formatCost(entry.cost_usd)} · {entry.output_tokens ?? "—"} out
          </span>
          <Link
            href={`/a/${entry.artifact_public_id}`}
            className="text-[12px] font-medium text-lime-benchlee hover:underline"
          >
            Inspect →
          </Link>
        </div>
      )}
    </article>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-[0.1em] text-ink-500">
        {label}
      </div>
      <div className="tnum truncate text-[12.5px] text-ink-200">{value}</div>
    </div>
  );
}
