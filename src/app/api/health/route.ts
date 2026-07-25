import { queryOne } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Compose healthcheck: the app is only healthy if Postgres answers. */
export async function GET() {
  try {
    const row = await queryOne<{ models: string; artifacts: string }>(
      `SELECT (SELECT count(*) FROM models) AS models,
              (SELECT count(*) FROM artifacts) AS artifacts`,
    );
    return Response.json({
      ok: true,
      db: "up",
      models: Number(row?.models ?? 0),
      artifacts: Number(row?.artifacts ?? 0),
    });
  } catch (error) {
    return Response.json(
      { ok: false, db: "down", error: (error as Error).message },
      { status: 503 },
    );
  }
}
