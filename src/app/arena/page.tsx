import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl, categoryLabel } from "@/lib/brand";
import { entriesForTask, getTask, randomMatchup, siteStats } from "@/lib/queries";
import { ArenaBoard } from "@/components/ArenaBoard";
import { SectionHeading } from "@/components/ui";
import type { Entry, Task } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Arena — blind head to head",
  description:
    "Two artifacts, no labels. Pick the one you would ship, then find out which model made it.",
};

type Search = { m?: string; task?: string; a?: string; b?: string };

export default async function ArenaPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const stats = await siteStats();

  let matchup: { task: Task; left: Entry; right: Entry } | null = null;

  // A shared matchup link (?task=&a=&b=) reproduces the exact pairing; otherwise
  // ?m= seeds a deterministic pick so a refresh keeps the same two artifacts.
  if (sp.task && sp.a && sp.b) {
    const task = await getTask(sp.task);
    if (task) {
      const entries = await entriesForTask(task.slug);
      const left = entries.find((e) => e.model.slug === sp.a);
      const right = entries.find((e) => e.model.slug === sp.b);
      if (left && right && left.run_id !== right.run_id) {
        matchup = { task, left, right };
      }
    }
  }

  if (!matchup && sp.task) {
    const task = await getTask(sp.task);
    if (task) {
      const entries = await entriesForTask(task.slug);
      if (entries.length >= 2) {
        const seed = hash(`${task.slug}:${sp.m ?? ""}`);
        const a = seed % entries.length;
        let b = (seed >> 3) % entries.length;
        if (b === a) b = (a + 1) % entries.length;
        matchup = { task, left: entries[a], right: entries[b] };
      }
    }
  }

  if (!matchup) {
    matchup = await randomMatchup(sp.m);
  }

  if (!matchup) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-[28px] font-semibold text-ink-100">
          No matchups available
        </h1>
        <p className="mt-3 text-[15px] text-ink-400">
          The Arena needs at least two models with artifacts for the same
          benchmark. Seed the database and come back.
        </p>
      </div>
    );
  }

  const { task, left, right } = matchup;
  const shareUrl = absoluteUrl(
    `/arena?task=${task.slug}&a=${left.model.slug}&b=${right.model.slug}`,
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading eyebrow="Arena · blind" title="Which one would you ship?">
          Same prompt, same viewport, names hidden. Vote first, find out whose it
          was second — that order is the entire point.
        </SectionHeading>
        <div className="text-right">
          <div className="tnum text-[26px] font-semibold text-ink-100">
            {stats.votes.toLocaleString()}
          </div>
          <div className="text-[11px] uppercase tracking-[0.12em] text-ink-500">
            ballots cast
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-ink-700 bg-ink-900 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[11px] uppercase tracking-[0.14em] text-lime-benchlee">
              {categoryLabel(task.category)}
            </span>
            <h2 className="mt-1 text-[19px] font-semibold tracking-[-0.015em] text-ink-100">
              {task.title}
            </h2>
          </div>
          <Link
            href={`/tasks/${task.slug}`}
            className="text-[13px] font-medium text-ink-300 hover:text-lime-benchlee"
          >
            See all entries →
          </Link>
        </div>
        <p className="mt-3 font-mono text-[13px] leading-relaxed text-ink-400">
          {task.prompt}
        </p>
      </div>

      <div className="mt-8">
        <ArenaBoard
          task={task}
          left={left}
          right={right}
          shareUrl={shareUrl}
        />
      </div>

      <p className="mt-10 text-center text-[13px] text-ink-500">
        One ballot is recorded per vote against an anonymous cookie. Results feed
        the{" "}
        <Link href="/leaderboard" className="text-ink-300 hover:text-lime-benchlee">
          leaderboard
        </Link>
        .
      </p>
    </div>
  );
}

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}
