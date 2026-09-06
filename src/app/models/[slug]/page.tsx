import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPercent } from "@/lib/brand";
import {
  entriesForModel,
  getModel,
  getTask,
  listModels,
  standings,
} from "@/lib/queries";
import { ArtifactCard } from "@/components/ArtifactCard";
import { SectionHeading } from "@/components/ui";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const model = await getModel(slug);
  if (!model) return { title: "Model not found" };
  return {
    title: model.name,
    description: `Everything ${model.name} built in the Benchlee suite — rendered, not summarised.`,
    openGraph: {
      title: `${model.name} on Benchlee`,
      description: `Everything ${model.name} built, rendered live.`,
      images: [{ url: `/models/${model.slug}/opengraph-image` }],
    },
  };
}

export default async function ModelPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [model, allModels, board] = await Promise.all([
    getModel(slug),
    listModels(),
    standings(),
  ]);
  if (!model) notFound();

  const entries = await entriesForModel(model.slug);
  const tasks = await Promise.all(entries.map((e) => getTask(e.task_slug)));
  const stat = board.find((s) => s.slug === model.slug);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <nav className="mb-6 flex items-center gap-2 text-base text-ink-300">
        <Link href="/models" className="hover:text-lime-benchlee">
          Models
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-ink-200">{model.name}</span>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-8">
        <div className="max-w-2xl">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-[40px] font-semibold leading-tight tracking-[-0.03em] text-ink-100">
                {model.name}
              </h1>
              <p className="text-base text-ink-300">{model.vendor}</p>
            </div>
          </div>

          {model.notes && (
            <details className="mt-5"><summary>Model notes</summary><p className="mt-3 text-ink-300">{model.notes}</p></details>
          )}

          {model.homepage_url && (
            <a
              href={model.homepage_url}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-3 inline-block text-base text-ink-300 underline decoration-ink-600 underline-offset-2 hover:text-lime-benchlee"
            >
              Vendor page ↗
            </a>
          )}
        </div>

      </header>

      <div className="mt-14">
        <SectionHeading title="Everything it built">
          Latest run for each benchmark.
        </SectionHeading>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {entries.map((entry, i) => {
          const task = tasks[i];
          if (!task) return null;
          return (
            <div key={entry.run_id}>
              <Link
                href={`/tasks/${entry.task_slug}`}
                className="mb-2 block text-base text-ink-300 hover:text-lime-benchlee"
              >
                {entry.task_title}
              </Link>
              <ArtifactCard entry={entry} task={task} />
            </div>
          );
        })}
      </div>

      <section className="mt-12" aria-label="Model statistics">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 rounded-xl border border-ink-700 bg-ink-900 p-5">
          <Metric label="Historical win rate" value={formatPercent(stat?.win_rate ?? null)} />
          <Metric
            label="Historical record"
            value={stat ? `${stat.wins}–${stat.losses}` : "—"}
          />
          <Metric
            label="Editorial avg"
            value={stat?.rubric_avg?.toFixed(2) ?? "—"}
          />
          <Metric label="Artifacts" value={String(entries.length)} />
          <Metric
            label="Context"
            value={
              model.context_window
                ? `${(model.context_window / 1000).toFixed(0)}K`
                : "—"
            }
          />
          <Metric
            label="Benchmarks"
            value={String(new Set(entries.map((e) => e.task_slug)).size)}
          />
        </dl>
      </section>

      <nav className="mt-16 border-t border-ink-800 pt-8">
        <div className="text-base text-ink-300">
          Other models
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {allModels
            .filter((m) => m.slug !== model.slug)
            .map((m) => (
              <Link
                key={m.id}
                href={`/models/${m.slug}`}
                className="flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-900 px-3.5 py-2 text-base text-ink-200 transition-colors hover:border-ink-500"
              >
                {m.name}
              </Link>
            ))}
        </div>
      </nav>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-base text-ink-300">
        {label}
      </dt>
      <dd className="tnum mt-1 text-2xl text-ink-100">{value}</dd>
    </div>
  );
}
