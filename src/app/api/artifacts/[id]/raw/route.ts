import { artifactContent } from "@/lib/queries";

export const dynamic = "force-dynamic";

/**
 * Serves an artifact's source for rendering inside the sandboxed iframe.
 *
 * Two independent guards apply to this response:
 *  1. The <iframe> sandbox (no `allow-same-origin`) — artifact code cannot reach
 *     Benchlee's origin.
 *  2. The CSP below — `default-src 'none'` means the artifact cannot fetch, load
 *     a remote font, beacon out, or embed anything. Inline styles and scripts are
 *     permitted because that is what "self-contained HTML file" means, and the
 *     opaque origin makes them harmless.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const artifact = await artifactContent(id);

  if (!artifact) {
    return new Response("Artifact not found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const contentType =
    artifact.kind === "svg"
      ? "image/svg+xml; charset=utf-8"
      : artifact.kind === "text"
        ? "text/plain; charset=utf-8"
        : "text/html; charset=utf-8";

  return new Response(artifact.content, {
    headers: {
      "content-type": contentType,
      "content-security-policy": [
        "default-src 'none'",
        "style-src 'unsafe-inline'",
        "script-src 'unsafe-inline'",
        "img-src data:",
        "font-src data:",
        "form-action 'none'",
        "base-uri 'none'",
      ].join("; "),
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      "cache-control": "public, max-age=300",
    },
  });
}
