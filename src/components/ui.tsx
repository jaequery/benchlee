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
    warn: "border-ink-300 bg-ink-850 text-ink-100",
  } as const;
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-base font-semibold tracking-wide ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function ProvenanceBadge({ provenance }: { provenance: Provenance }) {
  if (provenance === "live") {
    return (
      <Badge tone="lime" title="Produced by a real provider API call">
        Live run
      </Badge>
    );
  }
  return (
    <Badge
      tone="warn"
      title="Shipped demo fixture — not a transcript of a real API call"
    >
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
  const inner = (
    <span className="flex items-center gap-2.5 min-w-0">
      <span className="min-w-0">
        <span
          className="block truncate font-semibold text-ink-100"
        >
          {model.name}
        </span>
        {size === "md" && (
          <span className="block truncate text-base text-ink-300">
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
      <div className="text-base text-ink-300">
        {label}
      </div>
      <div className="mt-1 tnum text-base text-ink-100" title={hint}>
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
        <div className="mb-2 text-base font-semibold text-lime-benchlee">
          {eyebrow}
        </div>
      )}
      <h2 className="text-balance text-2xl font-semibold tracking-[-0.02em] text-ink-100">
        {title}
      </h2>
      {children && (
        <p className="mt-3 text-base leading-relaxed text-ink-300">{children}</p>
      )}
    </div>
  );
}

export function DemoDataNotice() {
  return (
    <div className="rounded-lg border border-ink-300 bg-ink-850 px-4 py-3 text-ink-100">
      <strong className="font-semibold">Demo dataset.</strong> Hand-authored fixtures,
      not real provider responses. Every fixture is labelled Demo.
    </div>
  );
}
