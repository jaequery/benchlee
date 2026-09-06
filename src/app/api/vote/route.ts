export const dynamic = "force-dynamic";

/** Public Benchlee is read-only. Historical results remain available. */
export function POST() {
  return Response.json(
    { error: "Benchlee is read-only. Browse published benchmark results." },
    { status: 410 },
  );
}
