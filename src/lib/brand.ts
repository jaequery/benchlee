/**
 * Benchlee brand constants.
 *
 * The name is bench (benchmark) + lee (a person). It reads as a name, which is
 * the point: a benchmark with a point of view, not a spreadsheet. Everything
 * user-facing that says "Benchlee" pulls its copy from here so the voice stays
 * consistent across pages, OG cards and metadata.
 */
export const BRAND = {
  name: "Benchlee",
  wordmark: "benchlee",
  tagline: "Show your work.",
  promise: "Explore model outputs, side by side.",
  pitch:
    "Benchmark outputs, side by side.",
  handle: "@benchlee",
} as const;

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

const CATEGORY_LABELS: Record<string, string> = {
  interface: "Interface",
  dataviz: "Data viz",
  motion: "Motion",
  craft: "Craft",
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

export function formatMs(ms: number | null): string {
  if (ms === null) return "—";
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

export function formatCost(usd: number | null): string {
  if (usd === null) return "—";
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(3)}`;
}

export function formatBytes(bytes: number | null): string {
  if (bytes === null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function formatPercent(rate: number | null): string {
  if (rate === null) return "—";
  return `${Math.round(rate * 100)}%`;
}
