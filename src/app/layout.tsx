import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { BRAND, SITE_URL } from "@/lib/brand";
import { LogoMark, Wordmark } from "@/components/Logo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s · ${BRAND.name}`,
  },
  description: BRAND.promise,
  applicationName: BRAND.name,
  openGraph: {
    type: "website",
    siteName: BRAND.name,
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.promise,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.promise,
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#08090b",
  colorScheme: "dark",
};

const NAV = [
  { href: "/benchmark", label: "Run a prompt" },
  { href: "/tasks", label: "Benchmarks" },
  { href: "/arena", label: "Arena" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/models", label: "Models" },
  { href: "/methodology", label: "Method" },
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-lime-benchlee focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink-950"
        >
          Skip to content
        </a>

        <header className="sticky top-0 z-40 border-b border-ink-800 bg-ink-950/85 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6">
            <Link href="/" aria-label={`${BRAND.name} home`}>
              <Wordmark size={26} />
            </Link>

            <nav className="ml-auto hidden items-center gap-1 md:flex">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-3 py-1.5 text-[13.5px] font-medium text-ink-300 transition-colors hover:bg-ink-850 hover:text-ink-100"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <Link
              href="/arena"
              className="ml-auto rounded-md bg-lime-benchlee px-3.5 py-1.5 text-[13.5px] font-semibold text-ink-950 transition-colors hover:bg-lime-dim md:ml-0"
            >
              Play blind
            </Link>
          </div>

          <nav className="flex gap-1 overflow-x-auto border-t border-ink-800 px-4 py-2 md:hidden">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 rounded-md px-2.5 py-1 text-[13px] font-medium text-ink-300 hover:text-ink-100"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <main id="main">{children}</main>

        <footer className="mt-24 border-t border-ink-800">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-8">
              <div className="max-w-sm">
                <LogoMark size={30} />
                <p className="mt-4 text-[15px] font-medium text-ink-100">
                  {BRAND.tagline}
                </p>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ink-400">
                  {BRAND.promise}
                </p>
              </div>

              <div className="flex gap-12">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.14em] text-ink-500">
                    Browse
                  </div>
                  <ul className="mt-3 space-y-2">
                    {NAV.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className="text-[13.5px] text-ink-300 hover:text-lime-benchlee"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.14em] text-ink-500">
                    About
                  </div>
                  <ul className="mt-3 space-y-2">
                    <li>
                      <Link
                        href="/methodology"
                        className="text-[13.5px] text-ink-300 hover:text-lime-benchlee"
                      >
                        How we score
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/methodology#data"
                        className="text-[13.5px] text-ink-300 hover:text-lime-benchlee"
                      >
                        Where data comes from
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <p className="mt-10 border-t border-ink-800 pt-6 text-[12.5px] text-ink-500">
              {BRAND.name} renders every artifact in a sandboxed frame with no
              network access. Model names and marks belong to their respective
              owners.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
