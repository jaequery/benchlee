import Link from "next/link";
import { BRAND, categoryLabel } from "@/lib/brand";
import { entriesForTask, listTasks, siteStats, standings } from "@/lib/queries";
import { ArtifactFrame } from "@/components/ArtifactFrame";
import { ModelChip, ProvenanceBadge, SectionHeading } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [tasks, stats, board] = await Promise.all([
    listTasks(),
    siteStats(),
    standings(),
  ]);

  const featured = tasks[0] ?? null;
  const featuredEntries = featured ? await entriesForTask(featured.slug) : [];
  const showcase = featuredEntries.slice(0, 3);

  return (
    <>
      {/* ---------------- hero ---------------- */}
      <section className="relative overflow-hidden border-b border-ink-800">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-24">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-ink-700 bg-ink-900 px-3 py-1 text-[12px] text-ink-300">
              <span className="size-1.5 rounded-full bg-lime-benchlee" />
              {stats.artifacts} artifacts · {stats.models} models ·{" "}
              {stats.tasks} benchmarks
            </span>

            <h1 className="mt-6 text-balance text-[42px] font-semibold leading-[1.04] tracking-[-0.035em] text-ink-100 sm:text-[64px]">
              Every benchmark shows you a number.
              <br />
              <span className="text-lime-benchlee">
                We show you what it built.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-ink-300">
              {BRAND.pitch}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/arena"
                className="rounded-lg bg-lime-benchlee px-5 py-2.5 text-[15px] font-semibold text-ink-950 transition-colors hover:bg-lime-dim"
              >
                Guess blind →
              </Link>
              <Link
                href={featured ? `/tasks/${featured.slug}` : "/tasks"}
                className="rounded-lg border border-ink-600 bg-ink-900 px-5 py-2.5 text-[15px] font-semibold text-ink-100 transition-colors hover:border-ink-500 hover:bg-ink-850"
              >
                Browse the evidence
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- featured side-by-side ---------------- */}
      {featured && showcase.length > 1 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              eyebrow={`Benchmark · ${categoryLabel(featured.category)}`}
              title={featured.title}
            >
              {featured.summary}
            </SectionHeading>
            <Link
              href={`/tasks/${featured.slug}`}
              className="rounded-lg border border-ink-600 px-4 py-2 text-[13.5px] font-medium text-ink-200 transition-colors hover:border-lime-benchlee hover:text-lime-benchlee"
            >
              All {featuredEntries.length} entries →
            </Link>
          </div>

          <p className="mt-6 rounded-lg border border-ink-700 bg-ink-900 px-4 py-3 font-mono text-[13px] leading-relaxed text-ink-300">
            <span className="text-lime-benchlee">$</span> {featured.prompt}
          </p>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {showcase.map((entry) => (
              <figure
                key={entry.run_id}
                className="overflow-hidden rounded-xl border border-ink-700 bg-ink-900"
              >
                <ArtifactFrame
                  publicId={entry.artifact_public_id}
                  title={`${entry.model.name} — ${featured.title}`}
                  viewportW={featured.viewport_w}
                  viewportH={featured.viewport_h}
                  className="border-b border-ink-800"
                />
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

          <p className="mt-6 text-[14px] text-ink-400">
            Same prompt. Same viewport. Same second. The difference you are
            looking at is the model.
          </p>
        </section>
      )}

      {/* ---------------- the argument ---------------- */}
      <section className="border-y border-ink-800 bg-ink-900/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <SectionHeading eyebrow="Why this exists" title="A score is a summary. An artifact is the evidence.">
            Benchmarks compress a model&apos;s work into one number and ask you to
            trust the compression. For subjective work — layout, taste, restraint
            — that number is throwing away exactly the part you cared about.
          </SectionHeading>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <Pillar
              n="01"
              title="You look, you judge"
              body="Every entry renders live in a sandboxed frame. Hover states work. Animations animate. You are not reading a claim about the output — you are looking at the output."
            />
            <Pillar
              n="02"
              title="Blind by default"
              body="In the Arena the labels come off. You pick the artifact you actually prefer before you find out whose it is, which is the only way to price in your own brand bias."
            />
            <Pillar
              n="03"
              title="Numbers stay honest"
              body="Rubric scores and latency are here, but always one click from the artifact they describe. A number you cannot trace back to a thing is a rumour."
            />
          </div>
        </div>
      </section>

      {/* ---------------- standings teaser ---------------- */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading eyebrow="Leaderboard" title="Ranked by what people picked">
            Standings come from blind head-to-head votes first and the editorial
            rubric second — never from a synthetic aggregate.
          </SectionHeading>
          <Link
            href="/leaderboard"
            className="rounded-lg border border-ink-600 px-4 py-2 text-[13.5px] font-medium text-ink-200 transition-colors hover:border-lime-benchlee hover:text-lime-benchlee"
          >
            Full table →
          </Link>
        </div>

        <ol className="mt-8 divide-y divide-ink-800 overflow-hidden rounded-xl border border-ink-700 bg-ink-900">
          {board.slice(0, 5).map((row, i) => (
            <li key={row.id} className="flex items-center gap-4 px-4 py-3.5">
              <span className="tnum w-6 text-[13px] text-ink-500">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1">
                <ModelChip model={row} size="sm" href={`/models/${row.slug}`} />
              </span>
              <span className="hidden text-right sm:block">
                <span className="tnum block text-[13.5px] text-ink-100">
                  {row.win_rate === null
                    ? "—"
                    : `${Math.round(row.win_rate * 100)}%`}
                </span>
                <span className="block text-[10.5px] uppercase tracking-[0.1em] text-ink-500">
                  win rate
                </span>
              </span>
              <span className="tnum w-24 text-right text-[13px] text-ink-400">
                {row.wins}–{row.losses}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------------- task index ---------------- */}
      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6">
        <SectionHeading eyebrow="The suite" title="Four briefs, chosen to be arguable">
          Each one produces something you can look at, and each one has a way to
          fail that a pass/fail test would never catch.
        </SectionHeading>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {tasks.map((task) => (
            <Link
              key={task.id}
              href={`/tasks/${task.slug}`}
              className="group rounded-xl border border-ink-700 bg-ink-900 p-5 transition-colors hover:border-lime-benchlee/50"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] uppercase tracking-[0.14em] text-lime-benchlee">
                  {categoryLabel(task.category)}
                </span>
                <span className="text-[12px] text-ink-500">
                  {task.viewport_w}×{task.viewport_h}
                </span>
              </div>
              <h3 className="mt-3 text-[19px] font-semibold tracking-[-0.015em] text-ink-100 group-hover:text-lime-benchlee">
                {task.title}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-400">
                {task.summary}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

function Pillar({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-ink-700 bg-ink-900 p-5">
      <div className="tnum text-[12px] text-lime-benchlee">{n}</div>
      <h3 className="mt-3 text-[17px] font-semibold tracking-[-0.01em] text-ink-100">
        {title}
      </h3>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-400">{body}</p>
    </div>
  );
}
