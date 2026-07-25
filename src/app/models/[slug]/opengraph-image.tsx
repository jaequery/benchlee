import { ImageResponse } from "next/og";
import { OG_CONTENT_TYPE, OG_SIZE, OgShell } from "@/lib/og";
import { entriesForModel, getModel, standings } from "@/lib/queries";
import { formatPercent } from "@/lib/brand";

export const runtime = "nodejs";
export const alt = "A model on Benchlee";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: { slug: string };
}) {
  const model = await getModel(params.slug);
  if (!model) {
    return new ImageResponse(
      <OgShell eyebrow="Model" title="Model not found" />,
      size,
    );
  }

  const [entries, board] = await Promise.all([
    entriesForModel(model.slug),
    standings(),
  ]);
  const stat = board.find((s) => s.slug === model.slug);

  return new ImageResponse(
    (
      <OgShell
        eyebrow={model.vendor}
        title={model.name}
        subtitle={`${entries.length} artifacts on Benchlee. See what it actually built.`}
        footer={`${formatPercent(stat?.win_rate ?? null)} blind win rate`}
        chips={entries.slice(0, 4).map((e) => ({
          label: e.task_title,
          color: model.accent_hex,
        }))}
      />
    ),
    size,
  );
}
