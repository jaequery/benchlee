"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useTransition } from "react";
import { ArtifactFrame } from "./ArtifactFrame";
import { ProvenanceBadge } from "./ui";
import type { Entry, Task } from "@/lib/types";

/**
 * The Arena: two artifacts, no labels, one question.
 *
 * Hiding the names until after the vote is the point — it is the only way to
 * separate "this looks better" from "I like that lab". The reveal is also the
 * shareable moment, so it doubles as the site's distribution loop.
 */
export function ArenaBoard({
  task,
  left,
  right,
  shareUrl,
}: {
  task: Task;
  left: Entry;
  right: Entry;
  shareUrl: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [choice, setChoice] = useState<"left" | "right" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const revealed = choice !== null;
  const winner = choice === "left" ? left : choice === "right" ? right : null;

  async function vote(side: "left" | "right") {
    if (revealed || pending) return;
    const won = side === "left" ? left : right;
    const lost = side === "left" ? right : left;
    setChoice(side);
    setError(null);

    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          taskId: task.id,
          winnerRunId: won.run_id,
          loserRunId: lost.run_id,
          blind: true,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(data?.error ?? "Vote could not be recorded.");
      }
    } catch {
      setError("Vote could not be recorded — you are offline?");
    }
  }

  function nextMatchup() {
    startTransition(() => {
      router.push(`/arena?m=${Math.random().toString(36).slice(2, 9)}`);
      router.refresh();
    });
  }

  async function copyShare() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Clipboard unavailable — copy the URL from the address bar.");
    }
  }

  return (
    <div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Side
          entry={left}
          task={task}
          label="A"
          revealed={revealed}
          isWinner={choice === "left"}
          onVote={() => vote("left")}
          disabled={revealed}
        />
        <Side
          entry={right}
          task={task}
          label="B"
          revealed={revealed}
          isWinner={choice === "right"}
          onVote={() => vote("right")}
          disabled={revealed}
        />
      </div>

      <div className="mt-8">
        {!revealed ? (
          <p className="text-center text-[14.5px] text-ink-400">
            No labels, no scores, no vibes from the brand. Pick the one you would
            actually ship.
          </p>
        ) : (
          <div className="rounded-xl border border-lime-benchlee/30 bg-lime-benchlee/[0.05] p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.16em] text-lime-benchlee">
                  You picked
                </div>
                <p className="mt-1.5 text-[22px] font-semibold tracking-[-0.02em] text-ink-100">
                  {winner?.model.name}{" "}
                  <span className="text-[15px] font-normal text-ink-400">
                    by {winner?.model.vendor}
                  </span>
                </p>
                <p className="mt-1 text-[13.5px] text-ink-400">
                  over{" "}
                  {(choice === "left" ? right : left).model.name} on{" "}
                  <Link
                    href={`/tasks/${task.slug}`}
                    className="text-ink-200 underline decoration-ink-600 underline-offset-2 hover:text-lime-benchlee"
                  >
                    {task.title}
                  </Link>
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={copyShare}
                  className="rounded-lg border border-ink-600 bg-ink-900 px-4 py-2.5 text-[14px] font-medium text-ink-100 transition-colors hover:border-ink-500"
                >
                  {copied ? "Link copied" : "Share this matchup"}
                </button>
                <button
                  type="button"
                  onClick={nextMatchup}
                  disabled={pending}
                  className="rounded-lg bg-lime-benchlee px-4 py-2.5 text-[14px] font-semibold text-ink-950 transition-colors hover:bg-lime-dim disabled:opacity-60"
                >
                  {pending ? "Loading…" : "Next matchup →"}
                </button>
              </div>
            </div>

            {error && (
              <p className="mt-4 text-[13px] text-amber-300">{error}</p>
            )}

            <div className="mt-5 grid gap-3 border-t border-lime-benchlee/15 pt-5 sm:grid-cols-2">
              <Reveal entry={left} label="A" won={choice === "left"} />
              <Reveal entry={right} label="B" won={choice === "right"} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Side({
  entry,
  task,
  label,
  revealed,
  isWinner,
  onVote,
  disabled,
}: {
  entry: Entry;
  task: Task;
  label: string;
  revealed: boolean;
  isWinner: boolean;
  onVote: () => void;
  disabled: boolean;
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl border bg-ink-900 transition-colors ${
        revealed && isWinner
          ? "border-lime-benchlee"
          : revealed
            ? "border-ink-800 opacity-70"
            : "border-ink-700"
      }`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-ink-800 px-4 py-3">
        <span className="flex items-center gap-2.5">
          <span
            className={`grid size-7 place-items-center rounded-md text-[12px] font-bold ${
              revealed && isWinner
                ? "bg-lime-benchlee text-ink-950"
                : "bg-ink-700 text-ink-200"
            }`}
          >
            {label}
          </span>
          <span className="text-[13.5px] font-medium text-ink-200">
            {revealed ? entry.model.name : "Anonymous entry"}
          </span>
        </span>
        {revealed && <ProvenanceBadge provenance={entry.provenance} />}
      </div>

      <ArtifactFrame
        publicId={entry.artifact_public_id}
        title={`Entry ${label} for ${task.title}`}
        viewportW={task.viewport_w}
        viewportH={task.viewport_h}
        className="border-b border-ink-800"
      />

      <div className="p-4">
        <button
          type="button"
          onClick={onVote}
          disabled={disabled}
          className={`w-full rounded-lg px-4 py-3 text-[15px] font-semibold transition-colors ${
            disabled
              ? isWinner
                ? "bg-lime-benchlee/20 text-lime-benchlee"
                : "bg-ink-850 text-ink-500"
              : "bg-ink-100 text-ink-950 hover:bg-white"
          }`}
        >
          {disabled
            ? isWinner
              ? "Your pick"
              : "Not picked"
            : `This one (${label})`}
        </button>
      </div>
    </div>
  );
}

function Reveal({
  entry,
  label,
  won,
}: {
  entry: Entry;
  label: string;
  won: boolean;
}) {
  return (
    <Link
      href={`/a/${entry.artifact_public_id}`}
      className="flex items-center gap-3 rounded-lg border border-ink-700 bg-ink-900 px-3.5 py-3 transition-colors hover:border-ink-500"
    >
      <span
        className="grid size-8 shrink-0 place-items-center rounded-md text-[11px] font-bold text-ink-950"
        style={{ backgroundColor: entry.model.accent_hex }}
      >
        {entry.model.badge}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-medium text-ink-100">
          {label} · {entry.model.name}
        </span>
        <span className="block truncate text-[11.5px] text-ink-400">
          {entry.model.vendor} · {entry.wins}–{entry.losses} head to head
        </span>
      </span>
      {won && (
        <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.1em] text-lime-benchlee">
          Picked
        </span>
      )}
    </Link>
  );
}
