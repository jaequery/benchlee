import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { recordVote } from "@/lib/queries";
import { queryOne } from "@/lib/db";

export const dynamic = "force-dynamic";

const VOTER_COOKIE = "bl_voter";

type Body = {
  taskId?: unknown;
  winnerRunId?: unknown;
  loserRunId?: unknown;
  blind?: unknown;
};

function asId(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isInteger(n) && n > 0 ? n : null;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const taskId = asId(body.taskId);
  const winnerRunId = asId(body.winnerRunId);
  const loserRunId = asId(body.loserRunId);

  if (!taskId || !winnerRunId || !loserRunId) {
    return Response.json({ ok: false, error: "missing_ids" }, { status: 400 });
  }
  if (winnerRunId === loserRunId) {
    return Response.json({ ok: false, error: "same_run" }, { status: 400 });
  }

  // Both runs must genuinely belong to the task being voted on, otherwise a
  // crafted request could inflate a model's record on a benchmark it never ran.
  const valid = await queryOne<{ n: string }>(
    `SELECT count(*) AS n FROM runs WHERE id = ANY($1::int[]) AND task_id = $2`,
    [[winnerRunId, loserRunId], taskId],
  );
  if (Number(valid?.n ?? 0) !== 2) {
    return Response.json({ ok: false, error: "run_task_mismatch" }, { status: 400 });
  }

  const jar = await cookies();
  let voterKey = jar.get(VOTER_COOKIE)?.value;
  if (!voterKey || !/^v:[0-9a-f-]{36}$/.test(voterKey)) {
    voterKey = `v:${randomUUID()}`;
    jar.set(VOTER_COOKIE, voterKey, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  await recordVote({
    taskId,
    winnerRunId,
    loserRunId,
    blind: body.blind !== false,
    voterKey,
  });

  return Response.json({ ok: true });
}
