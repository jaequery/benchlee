import type { ReactElement } from "react";

// Shared building blocks for the dynamic OG cards. Satori (which powers
// next/og) supports a narrow slice of CSS, so everything here is explicit
// flexbox with inline styles — no Tailwind classes, no shorthand gaps.

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const INK = "#08090b";
const LIME = "#d4ff3f";

export function OgShell({
  eyebrow,
  title,
  subtitle,
  footer,
  chips = [],
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  footer?: string;
  chips?: { label: string; color: string }[];
}): ReactElement {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: INK,
        backgroundImage:
          "radial-gradient(circle at 12% 0%, rgba(212,255,63,0.16) 0%, rgba(8,9,11,0) 55%)",
        padding: "64px 68px",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: LIME,
              alignItems: "flex-end",
              justifyContent: "center",
              paddingBottom: 9,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <div style={{ width: 6, height: 9, backgroundColor: INK, borderRadius: 2 }} />
              <div style={{ width: 6, height: 15, backgroundColor: INK, borderRadius: 2, marginLeft: 3 }} />
              <div style={{ width: 6, height: 22, backgroundColor: INK, borderRadius: 2, marginLeft: 3 }} />
            </div>
          </div>
          <div
            style={{
              marginLeft: 16,
              fontSize: 27,
              fontWeight: 600,
              color: "#eceef3",
              letterSpacing: "-0.02em",
            }}
          >
            benchlee
          </div>
          <div
            style={{
              marginLeft: "auto",
              fontSize: 19,
              color: "#6b7280",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </div>
        </div>

        <div
          style={{
            marginTop: 56,
            fontSize: title.length > 44 ? 62 : 76,
            lineHeight: 1.04,
            fontWeight: 700,
            color: "#f5f7fa",
            letterSpacing: "-0.035em",
            maxWidth: 1010,
            display: "flex",
          }}
        >
          {title}
        </div>

        {subtitle && (
          <div
            style={{
              marginTop: 26,
              fontSize: 29,
              lineHeight: 1.35,
              color: "#9aa2b1",
              maxWidth: 940,
              display: "flex",
            }}
          >
            {subtitle}
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center" }}>
        {chips.length > 0 && (
          <div style={{ display: "flex", alignItems: "center" }}>
            {chips.map((chip) => (
              <div
                key={chip.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginRight: 14,
                  paddingLeft: 16,
                  paddingRight: 18,
                  paddingTop: 9,
                  paddingBottom: 9,
                  borderRadius: 999,
                  border: "1px solid #2a2f39",
                  backgroundColor: "#101216",
                }}
              >
                <div
                  style={{
                    width: 13,
                    height: 13,
                    borderRadius: 999,
                    backgroundColor: chip.color,
                    marginRight: 11,
                  }}
                />
                <div style={{ fontSize: 22, color: "#c7ccd6" }}>{chip.label}</div>
              </div>
            ))}
          </div>
        )}
        <div
          style={{
            marginLeft: "auto",
            fontSize: 22,
            color: LIME,
            letterSpacing: "-0.01em",
          }}
        >
          {footer ?? "Show your work."}
        </div>
      </div>
    </div>
  );
}
