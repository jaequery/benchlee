import type { Metadata } from "next";
import Link from "next/link";
import { entriesForModel, listModels, standings } from "@/lib/queries";
import { ArtifactFrame } from "@/components/ArtifactFrame";
import { getTask } from "@/lib/queries";
import { SectionHeading } from "@/components/ui";
import { formatPercent } from "@/lib/brand";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Models",
  description: "Every model in the Benchlee suite, and the work it turned in.",
};

export default async function ModelsPage() {
  const [models, board] = await Promise.all([listModels(), standings()]);
  const standingBySlug = new Map(board.map((s) => [s.slug, s]));

  const cards = await Promise.all(
    models.map(async (model) => {
      const entries = await entriesForModel(model.slug);
      const first = entries[0] ?? null;
      const task = first ? await getTask(first.task_slug) : null;
      return { model, entries, first, task };
    }),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <SectionHeading eyebrow="The field" title="Models">
        Each one ran the same four briefs at the same viewport. Open a profile to
        see all of its work in one place.
      </SectionHeading>

      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ model, entries, first, task }) => {
          const stat = standingBySlug.get(model.slug);
          return (
            <Link
              key={model.id}
              href={`/models/${model.slug}`}
              className="group overflow-hidden rounded-xl border border-ink-700 bg-ink-900 transition-colors hover:border-ink-500"
            >
              {first && task && (
                <ArtifactFrame
                  publicId={first.artifact_public_id}
                  title={`${model.name} — ${first.task_title}`}
                  viewportW={task.viewport_w}
                  viewportH={task.viewport_h}
                  className="border-b border-ink-800"
                />
              )}

              <div className="p-5">
                <div className="flex items-center gap-3">
                  <span
                    className="grid size-9 shrink-0 place-items-center rounded-lg text-[12px] font-bold text-ink-950"
                    style={{ backgroundColor: model.accent_hex }}
                  >
                    {model.badge}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-[16px] font-semibold text-ink-100 group-hover:text-lime-benchlee">
                      {model.name}
                    </div>
                    <div className="truncate text-[12.5px] text-ink-400">
                      {model.vendor}
                    </div>
                  </div>
                </div>

                {model.notes && (
                  <p className="mt-3 text-[13.5px] leading-relaxed text-ink-400">
                    {model.notes}
                  </p>
                )}

                <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-ink-800 pt-4">
                  <div>
                    <dt className="text-[10.5px] uppercase tracking-[0.1em] text-ink-500">
                      Win rate
                    </dt>
                    <dd className="tnum mt-0.5 text-[14px] text-ink-100">
                      {formatPercent(stat?.win_rate ?? null)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10.5px] uppercase tracking-[0.1em] text-ink-500">
                      Rubric
                    </dt>
                    <dd className="tnum mt-0.5 text-[14px] text-ink-100">
                      {stat?.rubric_avg?.toFixed(2) ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10.5px] uppercase tracking-[0.1em] text-ink-500">
                      Artifacts
                    </dt>
                    <dd className="tnum mt-0.5 text-[14px] text-ink-100">
                      {entries.length}
                    </dd>
                  </div>
                </dl>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
