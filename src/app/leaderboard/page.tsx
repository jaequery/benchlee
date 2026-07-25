import type { Metadata } from "next";
import Link from "next/link";
import { formatPercent } from "@/lib/brand";
import { listTasks, siteStats, standings } from "@/lib/queries";
import { DemoDataNotice, SectionHeading } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Leaderboard",
  description:
    "Benchlee standings — ranked by blind head-to-head votes, with every number traceable back to an artifact.",
};

export default async function LeaderboardPage() {
  const [board, stats, tasks] = await Promise.all([
    standings(),
    siteStats(),
    listTasks(),
  ]);

  const leader = board[0];
  const maxWins = Math.max(1, ...board.map((r) => r.wins));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <SectionHeading eyebrow="Standings" title="Ranked by what people picked">
        Position is decided by blind head-to-head win rate. The editorial rubric
        is shown alongside it, not blended into it — two different kinds of
        evidence should not be averaged into one number that means neither.
      </SectionHeading>

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        <Tile label="Ballots cast" value={stats.votes.toLocaleString()} />
        <Tile
          label="Community votes"
          value={stats.community_votes.toLocaleString()}
          hint="excludes seeded editorial ballots"
        />
        <Tile label="Artifacts" value={stats.artifacts.toLocaleString()} />
        <Tile label="Benchmarks" value={String(stats.tasks)} />
      </div>

      {stats.live_runs === 0 && (
        <div className="mt-6">
          <DemoDataNotice />
        </div>
      )}

      <div className="mt-8 overflow-x-auto rounded-xl border border-ink-700 bg-ink-900">
        <table className="w-full min-w-[760px]">
          <thead>
            <tr className="border-b border-ink-800 text-left text-[11px] uppercase tracking-[0.12em] text-ink-500">
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Model</th>
              <th className="px-4 py-3 font-medium">Win rate</th>
              <th className="px-4 py-3 font-medium">Record</th>
              <th className="px-4 py-3 font-medium">Rubric avg</th>
              <th className="px-4 py-3 font-medium">Artifacts</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-800">
            {board.map((row, i) => (
              <tr key={row.id} className="group transition-colors hover:bg-ink-850/60">
                <td className="tnum px-4 py-4 text-[13px] text-ink-500">
                  {String(i + 1).padStart(2, "0")}
                </td>
                <td className="px-4 py-4">
                  <Link
                    href={`/models/${row.slug}`}
                    className="flex items-center gap-3"
                  >
                    <span
                      className="grid size-8 shrink-0 place-items-center rounded-md text-[11px] font-bold text-ink-950"
                      style={{ backgroundColor: row.accent_hex }}
                    >
                      {row.badge}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] font-medium text-ink-100 group-hover:text-lime-benchlee">
                        {row.name}
                      </span>
                      <span className="block truncate text-[11.5px] text-ink-500">
                        {row.vendor}
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <span className="tnum w-11 text-[14px] text-ink-100">
                      {formatPercent(row.win_rate)}
                    </span>
                    <span className="hidden h-1.5 w-28 overflow-hidden rounded-full bg-ink-800 sm:block">
                      <span
                        className="block h-full rounded-full"
                        style={{
                          width: `${(row.wins / maxWins) * 100}%`,
                          backgroundColor: row.accent_hex,
                        }}
                      />
                    </span>
                  </div>
                </td>
                <td className="tnum px-4 py-4 text-[13.5px] text-ink-300">
                  {row.wins}–{row.losses}
                </td>
                <td className="tnum px-4 py-4 text-[13.5px] text-ink-300">
                  {row.rubric_avg === null ? "—" : row.rubric_avg.toFixed(2)}
                </td>
                <td className="tnum px-4 py-4 text-[13.5px] text-ink-300">
                  {row.artifact_count}
                </td>
                <td className="px-4 py-4 text-right">
                  <Link
                    href={`/models/${row.slug}`}
                    className="text-[12.5px] font-medium text-ink-400 hover:text-lime-benchlee"
                  >
                    See its work →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {leader && (
        <p className="mt-6 text-[14px] leading-relaxed text-ink-400">
          <span className="text-ink-200">{leader.name}</span> leads on win rate,
          but a leaderboard row is a claim, not proof. Open{" "}
          <Link
            href={`/models/${leader.slug}`}
            className="text-lime-benchlee hover:underline"
          >
            its four artifacts
          </Link>{" "}
          and decide whether you agree.
        </p>
      )}

      <section className="mt-14">
        <SectionHeading title="Move the numbers yourself">
          Every vote in the Arena updates this table. It takes about eight
          seconds.
        </SectionHeading>
        <div className="mt-5 flex flex-wrap gap-2">
          {tasks.map((t) => (
            <Link
              key={t.id}
              href={`/arena?task=${t.slug}`}
              className="rounded-lg border border-ink-700 bg-ink-900 px-4 py-2 text-[13.5px] text-ink-200 transition-colors hover:border-lime-benchlee hover:text-lime-benchlee"
            >
              Vote on {t.title} →
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Tile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-ink-700 bg-ink-900 p-4">
      <div className="tnum text-[26px] font-semibold text-ink-100">{value}</div>
      <div className="mt-1 text-[11px] uppercase tracking-[0.12em] text-ink-500">
        {label}
      </div>
      {hint && <div className="mt-1 text-[11.5px] text-ink-500">{hint}</div>}
    </div>
  );
}
