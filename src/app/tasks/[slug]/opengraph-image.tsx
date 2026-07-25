import { ImageResponse } from "next/og";
import { OG_CONTENT_TYPE, OG_SIZE, OgShell } from "@/lib/og";
import { entriesForTask, getTask } from "@/lib/queries";

export const runtime = "nodejs";
export const alt = "A Benchlee benchmark";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: { slug: string };
}) {
  const task = await getTask(params.slug);
  if (!task) {
    return new ImageResponse(
      <OgShell eyebrow="Benchmark" title="Benchmark not found" />,
      size,
    );
  }

  const entries = await entriesForTask(task.slug);

  return new ImageResponse(
    (
      <OgShell
        eyebrow="Benchmark"
        title={task.title}
        subtitle={task.summary}
        footer={`${entries.length} models · look, don't trust`}
        chips={entries.slice(0, 4).map((e) => ({
          label: e.model.name,
          color: e.model.accent_hex,
        }))}
      />
    ),
    size,
  );
}
