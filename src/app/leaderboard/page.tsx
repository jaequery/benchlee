import type { Metadata } from "next";
import Link from "next/link";
import { formatPercent } from "@/lib/brand";
import { siteStats, standings } from "@/lib/queries";
import { DemoDataNotice, SectionHeading } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Leaderboard",
  description:
    "Historical standings with separate editorial scores and links to model outputs.",
};

export default async function LeaderboardPage() {
  const [board, stats] = await Promise.all([
    standings(),
    siteStats(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <SectionHeading eyebrow="Standings" title="Historical standings">
        Ordered by historical win rate; editorial scores break ties. Voting is closed.
        Seeded ballots are included; community turnout is shown separately.
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
            <tr className="border-b border-ink-800 text-left text-base text-ink-300">
              <th className="px-4 py-3 font-semibold">#</th>
              <th className="px-4 py-3 font-semibold">Model</th>
              <th className="px-4 py-3 font-semibold">Win rate</th>
              <th className="px-4 py-3 font-semibold">Record</th>
              <th className="px-4 py-3 font-semibold">Rubric avg</th>
              <th className="px-4 py-3 font-semibold">Artifacts</th>
              <th className="px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-800">
            {board.map((row, i) => (
              <tr key={row.id} className="group transition-colors hover:bg-ink-850/60">
                <td className="tnum px-4 py-4 text-base text-ink-300">
                  {String(i + 1).padStart(2, "0")}
                </td>
                <td className="px-4 py-4">
                  <Link
                    href={`/models/${row.slug}`}
                    className="flex items-center gap-3"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-base font-semibold text-ink-100 group-hover:text-lime-benchlee">
                        {row.name}
                      </span>
                      <span className="block truncate text-base text-ink-300">
                        {row.vendor}
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <span className="tnum w-11 text-base text-ink-100">
                      {formatPercent(row.win_rate)}
                    </span>
                  </div>
                </td>
                <td className="tnum px-4 py-4 text-base text-ink-300">
                  {row.wins}–{row.losses}
                </td>
                <td className="tnum px-4 py-4 text-base text-ink-300">
                  {row.rubric_avg === null ? "—" : row.rubric_avg.toFixed(2)}
                </td>
                <td className="tnum px-4 py-4 text-base text-ink-300">
                  {row.artifact_count}
                </td>
                <td className="px-4 py-4 text-right">
                  <Link
                    href={`/models/${row.slug}`}
                    className="text-base font-semibold text-ink-300 hover:text-lime-benchlee"
                  >
                    See its work →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
      <div className="tnum text-2xl font-semibold text-ink-100">{value}</div>
      <div className="mt-1 text-base text-ink-300">
        {label}
      </div>
      {hint && <div className="mt-1 text-base text-ink-300">{hint}</div>}
    </div>
  );
}
