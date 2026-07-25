/**
 * The Benchlee mark: three rising bars sitting on a bench rail.
 * Reads as a bar chart and as a weight bench — bench-mark, literally.
 */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect width="32" height="32" rx="8" fill="var(--color-lime-benchlee)" />
      <rect x="7" y="16" width="4.5" height="6" rx="1" fill="#08090b" />
      <rect x="13.75" y="12" width="4.5" height="10" rx="1" fill="#08090b" />
      <rect x="20.5" y="7" width="4.5" height="15" rx="1" fill="#08090b" />
      <rect x="7" y="24" width="18" height="2.5" rx="1.25" fill="#08090b" />
    </svg>
  );
}

export function Wordmark({ size = 28 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark size={size} />
      <span className="text-[19px] font-semibold tracking-[-0.03em] text-ink-100">
        benchlee
      </span>
    </span>
  );
}
