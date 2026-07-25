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
import { rubricAverage } from "@/lib/types";

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

  const best = [...entries].sort(
    (a, b) => (rubricAverage(b.scores) ?? 0) - (rubricAverage(a.scores) ?? 0),
  )[0];
  const worst = [...entries].sort(
    (a, b) => (rubricAverage(a.scores) ?? 0) - (rubricAverage(b.scores) ?? 0),
  )[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <nav className="mb-6 flex items-center gap-2 text-[13px] text-ink-400">
        <Link href="/models" className="hover:text-lime-benchlee">
          Models
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-ink-200">{model.name}</span>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-8">
        <div className="max-w-2xl">
          <div className="flex items-center gap-4">
            <span
              className="grid size-14 shrink-0 place-items-center rounded-xl text-[16px] font-bold text-ink-950"
              style={{ backgroundColor: model.accent_hex }}
            >
              {model.badge}
            </span>
            <div>
              <h1 className="text-[34px] font-semibold leading-tight tracking-[-0.03em] text-ink-100">
                {model.name}
              </h1>
              <p className="text-[15px] text-ink-400">{model.vendor}</p>
            </div>
          </div>

          {model.notes && (
            <p className="mt-5 text-[16px] leading-relaxed text-ink-300">
              {model.notes}
            </p>
          )}

          {model.homepage_url && (
            <a
              href={model.homepage_url}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-3 inline-block text-[13.5px] text-ink-400 underline decoration-ink-600 underline-offset-2 hover:text-lime-benchlee"
            >
              Vendor page ↗
            </a>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-x-10 gap-y-5 rounded-xl border border-ink-700 bg-ink-900 p-5">
          <Metric label="Win rate" value={formatPercent(stat?.win_rate ?? null)} />
          <Metric
            label="Record"
            value={stat ? `${stat.wins}–${stat.losses}` : "—"}
          />
          <Metric
            label="Rubric avg"
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
      </header>

      {best && worst && best.run_id !== worst.run_id && (
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Callout
            eyebrow="Strongest showing"
            title={best.task_title}
            score={rubricAverage(best.scores)}
            href={`/a/${best.artifact_public_id}`}
            accent={model.accent_hex}
          />
          <Callout
            eyebrow="Weakest showing"
            title={worst.task_title}
            score={rubricAverage(worst.scores)}
            href={`/a/${worst.artifact_public_id}`}
            accent="#4b5563"
          />
        </div>
      )}

      <div className="mt-14">
        <SectionHeading title="Everything it built">
          One card per benchmark, newest run. These are the same frames you see
          on the benchmark pages — nothing is re-rendered or cleaned up for the
          profile.
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
                className="mb-2 block text-[12px] uppercase tracking-[0.12em] text-ink-500 hover:text-lime-benchlee"
              >
                {entry.task_title}
              </Link>
              <ArtifactCard entry={entry} task={task} />
            </div>
          );
        })}
      </div>

      <nav className="mt-16 border-t border-ink-800 pt-8">
        <div className="text-[11px] uppercase tracking-[0.14em] text-ink-500">
          Other models
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {allModels
            .filter((m) => m.slug !== model.slug)
            .map((m) => (
              <Link
                key={m.id}
                href={`/models/${m.slug}`}
                className="flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-900 px-3.5 py-2 text-[13.5px] text-ink-200 transition-colors hover:border-ink-500"
              >
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: m.accent_hex }}
                />
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
      <dt className="text-[10.5px] uppercase tracking-[0.12em] text-ink-500">
        {label}
      </dt>
      <dd className="tnum mt-1 text-[19px] text-ink-100">{value}</dd>
    </div>
  );
}

function Callout({
  eyebrow,
  title,
  score,
  href,
  accent,
}: {
  eyebrow: string;
  title: string;
  score: number | null;
  href: string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-4 rounded-xl border border-ink-700 bg-ink-900 p-5 transition-colors hover:border-ink-500"
    >
      <div>
        <div className="text-[11px] uppercase tracking-[0.12em] text-ink-500">
          {eyebrow}
        </div>
        <div className="mt-1.5 text-[17px] font-medium text-ink-100">{title}</div>
      </div>
      <div
        className="tnum shrink-0 text-[26px] font-semibold"
        style={{ color: accent }}
      >
        {score?.toFixed(1) ?? "—"}
      </div>
    </Link>
  );
}
