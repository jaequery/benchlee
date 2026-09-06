import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { BRAND, SITE_URL } from "@/lib/brand";
import { Wordmark } from "@/components/Logo";
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
  themeColor: "#101211",
  colorScheme: "dark",
};

const NAV = [
  { href: "/tasks", label: "Benchmarks" },
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
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-lime-benchlee focus:px-3 focus:py-2 focus:text-base focus:font-semibold focus:text-ink-950"
        >
          Skip to content
        </a>

        <header className="sticky top-0 z-40 border-b border-ink-800 bg-ink-950">
          <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6">
            <Link href="/" aria-label={`${BRAND.name} home`}>
              <Wordmark size={26} />
            </Link>

            <nav className="ml-auto hidden items-center gap-1 md:flex">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-3 py-1.5 text-base font-semibold text-ink-300 transition-colors hover:bg-ink-850 hover:text-ink-100"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <details className="ml-auto border-0 py-0 md:hidden">
              <summary>Browse</summary>
          <nav className="absolute right-4 top-full flex min-w-48 flex-col gap-2 rounded-lg border border-ink-600 bg-ink-950 p-4">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 rounded-md px-2.5 py-1 text-base font-semibold text-ink-300 hover:text-ink-100"
              >
                {item.label}
              </Link>
            ))}
          </nav>
            </details>
          </div>

        </header>

        <main id="main">{children}</main>

        <footer className="mx-auto mt-24 flex max-w-7xl flex-wrap justify-between gap-6 px-4 py-10 text-ink-300 sm:px-6">
          <span>{BRAND.name} · {BRAND.tagline}</span>
          <Link href="/methodology">Method &amp; data</Link>
        </footer>
      </body>
    </html>
  );
}
