import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { listTasks, siteStats } from "@/lib/queries";
import { DemoDataNotice, SectionHeading } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Method",
  description:
    "How Benchlee runs its benchmarks, where the data comes from, and what the numbers are allowed to mean.",
};

export default async function MethodologyPage() {
  const [tasks, stats] = await Promise.all([listTasks(), siteStats()]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <SectionHeading eyebrow="Method" title="How this works, and what it refuses to do">
        {BRAND.name} is built on one claim: for subjective work, showing the
        output beats summarising it. Everything below follows from that.
      </SectionHeading>

      <div className="mt-12 space-y-14">
        <Section n="01" title="The artifact is the result">
          <p>
            A run produces a single self-contained HTML file. We store that file
            verbatim in Postgres and render it in a sandboxed iframe at a fixed
            viewport. Nothing is re-formatted, prettified, or fixed up. If a model
            shipped a broken layout, you see the broken layout.
          </p>
          <p>
            The frames have no network access and no access to this origin, so an
            artifact cannot phone home, load a font, or read your session.
          </p>
        </Section>

        <Section n="02" title="Every model gets the identical brief">
          <p>
            One prompt string per benchmark, sent verbatim, at the same
            temperature, with no system prompt and no retries. The prompt is
            printed in full on every benchmark page — if you think it is leading,
            you can see exactly how.
          </p>
          <ul>
            {tasks.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/tasks/${t.slug}`}
                  className="text-ink-200 underline decoration-ink-600 underline-offset-2 hover:text-lime-benchlee"
                >
                  {t.title}
                </Link>{" "}
                — {t.summary}
              </li>
            ))}
          </ul>
        </Section>

        <Section n="03" title="Ranking comes from blind human votes">
          <p>
            The leaderboard is ordered by head-to-head win rate in the{" "}
            <Link href="/arena" className="text-lime-benchlee hover:underline">
              Arena
            </Link>
            , where two artifacts are shown with the labels off. You vote, then
            the names appear. Knowing which lab made something changes what people
            say they prefer, so we take that information away until the ballot is
            in.
          </p>
          <p>
            One ballot per vote, keyed to an anonymous cookie. We do not
            de-duplicate aggressively, and we do not pretend this is a
            representative sample — it is a popularity signal, labelled as one.
          </p>
        </Section>

        <Section n="04" title="The rubric is editorial, and says so">
          <p>
            Each run also carries a small set of 0–10 scores with written
            rationales. These are editorial judgements, not measurements. They are
            displayed next to the win rate rather than blended into it, because
            averaging a vote count with a taste score produces a number that means
            neither thing.
          </p>
          <p>
            Every score links back to the artifact it describes. A number you
            cannot trace to a thing is a rumour.
          </p>
        </Section>

        <Section n="05" title="What this benchmark is bad at" id="limits">
          <p>
            It does not measure reasoning, long-context recall, tool use, factual
            accuracy, safety, or anything requiring more than one turn. The curated suite is four
            front-end briefs. A model that wins here is good at these four things
            and you should not extrapolate further than that.
          </p>
          <p>
            Sample size is one generation per model per task. Temperature is
            non-zero, so a re-run would not be identical. Treat single entries as
            anecdotes and the aggregate as weak evidence.
          </p>
        </Section>

        <Section n="06" title="Where the data on this page comes from" id="data">
          <p>
            This deployment currently holds{" "}
            <span className="tnum text-ink-100">{stats.artifacts}</span> artifacts
            across <span className="tnum text-ink-100">{stats.models}</span>{" "}
            models, of which{" "}
            <span className="tnum text-ink-100">{stats.live_runs}</span> come from
            live provider calls.
          </p>
          {stats.live_runs === 0 && <DemoDataNotice />}
          <p>
            Live runs are produced by{" "}
            <code className="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-[12.5px] text-ink-200">
              pnpm bench:run
            </code>
            , which calls the provider APIs directly, stores the returned file
            verbatim, and records real latency and token counts. Runs it writes
            are marked <span className="text-lime-benchlee">Live run</span>;
            everything else is marked{" "}
            <span className="text-amber-300">Demo</span> and is a shipped fixture
            so a fresh install has something to show.
          </p>
        </Section>

        <Section n="07" title="Custom prompt comparisons">
          <p>
            /benchmark sends your exact prompt to each selected model and effort
            setting. Results are saved separately from the curated suite and do
            not contribute votes or editorial scores to the leaderboard. Effort
            controls are provider-specific; they are not equivalent across labs.
          </p>
          <p>
            Compare the artifacts directly at a shared 1280 × 800 viewport.
            Latency includes the provider request and response, not queue or storage
            time. Token counts come from the provider, including thinking tokens
            where reported. Missing counts remain unknown. These one-shot runs do
            not establish a statistically reliable quality ranking. Raw responses
            are preserved, including markdown fences or malformed HTML.
          </p>
        </Section>

        <Section n="08" title="Adding a model or a benchmark">
          <p>
            Both live in{" "}
            <code className="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-[12.5px] text-ink-200">
              db/seed/catalog.json
            </code>
            . Add an entry, drop matching artifact files under{" "}
            <code className="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-[12.5px] text-ink-200">
              db/seed/artifacts/
            </code>
            , re-run the seed. The schema, not the fixtures, is the product — the
            suite is meant to be replaced.
          </p>
        </Section>
      </div>

      <div className="mt-16 rounded-xl border border-ink-700 bg-ink-900 p-6">
        <h2 className="text-[18px] font-semibold text-ink-100">
          Disagree with a score?
        </h2>
        <p className="mt-2 text-[14.5px] leading-relaxed text-ink-400">
          Good — that is the design. Go and outvote it.
        </p>
        <Link
          href="/arena"
          className="mt-4 inline-block rounded-lg bg-lime-benchlee px-4 py-2.5 text-[14px] font-semibold text-ink-950 transition-colors hover:bg-lime-dim"
        >
          Open the Arena →
        </Link>
      </div>
    </div>
  );
}

function Section({
  n,
  title,
  id,
  children,
}: {
  n: string;
  title: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="tnum text-[12px] text-lime-benchlee">{n}</div>
      <h2 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-ink-100">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-[15.5px] leading-relaxed text-ink-300 [&_li]:mb-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
