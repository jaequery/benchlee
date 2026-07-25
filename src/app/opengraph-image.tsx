import { ImageResponse } from "next/og";
import { OG_CONTENT_TYPE, OG_SIZE, OgShell } from "@/lib/og";

export const runtime = "nodejs";
export const alt = "Benchlee — the LLM benchmark that shows you what the models built";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return new ImageResponse(
    (
      <OgShell
        eyebrow="LLM benchmark"
        title="Every benchmark shows a number. We show what it built."
        subtitle="Real HTML from every model, rendered live, side by side."
      />
    ),
    size,
  );
}
