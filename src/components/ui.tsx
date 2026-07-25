import Link from "next/link";
import type { ReactNode } from "react";
import type { Model, Provenance } from "@/lib/types";

export function Badge({
  children,
  tone = "neutral",
  title,
}: {
  children: ReactNode;
  tone?: "neutral" | "lime" | "warn";
  title?: string;
}) {
  const tones = {
    neutral: "border-ink-600 bg-ink-800 text-ink-300",
    lime: "border-lime-benchlee/40 bg-lime-benchlee/10 text-lime-benchlee",
    warn: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  } as const;
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function ProvenanceBadge({ provenance }: { provenance: Provenance }) {
  if (provenance === "live") {
    return (
      <Badge tone="lime" title="Produced by a real provider API call">
        <span className="size-1.5 rounded-full bg-lime-benchlee" />
        Live run
      </Badge>
    );
  }
  return (
    <Badge
      tone="warn"
      title="Shipped demo fixture — not a transcript of a real API call"
    >
      <span className="size-1.5 rounded-full bg-amber-400" />
      Demo
    </Badge>
  );
}

export function ModelChip({
  model,
  size = "md",
  href,
}: {
  model: Pick<Model, "slug" | "name" | "badge" | "accent_hex" | "vendor">;
  size?: "sm" | "md";
  href?: string;
}) {
  const dims = size === "sm" ? "size-6 text-[10px]" : "size-8 text-[11px]";
  const inner = (
    <span className="flex items-center gap-2.5 min-w-0">
      <span
        className={`${dims} grid place-items-center rounded-md font-bold tracking-tight text-ink-950 shrink-0`}
        style={{ backgroundColor: model.accent_hex }}
        aria-hidden="true"
      >
        {model.badge}
      </span>
      <span className="min-w-0">
        <span
          className={`block truncate font-medium text-ink-100 ${
            size === "sm" ? "text-[13px]" : "text-sm"
          }`}
        >
          {model.name}
        </span>
        {size === "md" && (
          <span className="block truncate text-[11px] text-ink-400">
            {model.vendor}
          </span>
        )}
      </span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="group hover:opacity-90 transition-opacity">
        {inner}
      </Link>
    );
  }
  return inner;
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.12em] text-ink-400">
        {label}
      </div>
      <div className="mt-1 tnum text-[15px] text-ink-100" title={hint}>
        {value}
      </div>
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="max-w-2xl">
      {eyebrow && (
        <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-lime-benchlee">
          {eyebrow}
        </div>
      )}
      <h2 className="text-balance text-2xl font-semibold tracking-[-0.02em] text-ink-100 sm:text-[28px]">
        {title}
      </h2>
      {children && (
        <p className="mt-3 text-[15px] leading-relaxed text-ink-300">{children}</p>
      )}
    </div>
  );
}

export function DemoDataNotice() {
  return (
    <div className="rounded-lg border border-amber-500/25 bg-amber-500/[0.06] px-4 py-3 text-[13px] leading-relaxed text-amber-200/90">
      <strong className="font-semibold text-amber-200">Demo dataset.</strong> This
      deployment ships hand-authored fixture artifacts so the site has something
      to show on first boot. They are labelled{" "}
      <span className="tnum">Demo</span> everywhere and are{" "}
      <em>not</em> transcripts of real provider calls. Run{" "}
      <code className="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-[12px] text-ink-200">
        pnpm bench:run
      </code>{" "}
      with API keys to publish real ones.
    </div>
  );
}
