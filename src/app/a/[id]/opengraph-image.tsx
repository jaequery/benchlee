import { ImageResponse } from "next/og";
import { OG_CONTENT_TYPE, OG_SIZE, OgShell } from "@/lib/og";
import { entryByArtifactPublicId } from "@/lib/queries";
import { rubricAverage } from "@/lib/types";

export const runtime = "nodejs";
export const alt = "An artifact on Benchlee";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: { id: string } }) {
  const entry = await entryByArtifactPublicId(params.id);
  if (!entry) {
    return new ImageResponse(
      <OgShell eyebrow="Artifact" title="Artifact not found" />,
      size,
    );
  }

  const avg = rubricAverage(entry.scores);

  return new ImageResponse(
    (
      <OgShell
        eyebrow="Artifact"
        title={`${entry.model.name} built this.`}
        subtitle={`${entry.task_title} — rendered live, not summarised.`}
        footer={avg === null ? "Judge it yourself" : `Rubric ${avg.toFixed(1)} / 10`}
        chips={[
          { label: entry.model.name, color: entry.model.accent_hex },
          { label: entry.task_title, color: "#6b7280" },
        ]}
      />
    ),
    size,
  );
}
