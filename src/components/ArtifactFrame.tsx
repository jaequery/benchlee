"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Renders a model's artifact for real, in a sandboxed iframe.
 *
 * This is the whole thesis of Benchlee, so it is deliberately not a screenshot:
 * the artifact runs. Hover states work, CSS animations animate, the CSS clock
 * actually keeps time.
 *
 * Safety: the iframe is sandboxed WITHOUT `allow-same-origin`, so artifact code
 * runs in an opaque origin with no access to Benchlee's DOM, cookies or storage.
 * The raw route additionally sends a CSP that blocks all network egress.
 *
 * Fit: the frame is laid out at the task's authored viewport (e.g. 1280x860)
 * and scaled down to whatever width the card actually has, so every model's work
 * is judged at the same viewport rather than at whatever the grid happens to be.
 */
export function ArtifactFrame({
  publicId,
  title,
  viewportW,
  viewportH,
  className = "",
  interactive = false,
  src,
}: {
  publicId: string;
  src?: string;
  title: string;
  viewportW: number;
  viewportH: number;
  className?: string;
  interactive?: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const measure = () => {
      const width = host.clientWidth;
      if (width > 0) setScale(width / viewportW);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    return () => observer.disconnect();
  }, [viewportW]);

  return (
    <div
      ref={hostRef}
      className={`relative overflow-hidden bg-ink-900 ${className}`}
      style={{ aspectRatio: `${viewportW} / ${viewportH}` }}
    >
      {!loaded && (
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-[11px] uppercase tracking-[0.16em] text-ink-500">
            rendering artifact…
          </span>
        </div>
      )}
      {scale !== null && (
        <iframe
          src={src ?? `/api/artifacts/${encodeURIComponent(publicId)}/raw`}
          title={title}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          sandbox="allow-scripts"
          referrerPolicy="no-referrer"
          scrolling="no"
          className={`absolute left-0 top-0 origin-top-left border-0 transition-opacity duration-200 ${
            loaded ? "opacity-100" : "opacity-0"
          } ${interactive ? "" : "pointer-events-none"}`}
          style={{
            width: `${viewportW}px`,
            height: `${viewportH}px`,
            transform: `scale(${scale})`,
          }}
        />
      )}
    </div>
  );
}
