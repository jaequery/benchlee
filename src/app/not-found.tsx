import Link from "next/link";
import { LogoMark } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-start px-4 py-28 sm:px-6">
      <LogoMark size={40} />
      <h1 className="mt-8 text-[64px] font-semibold leading-none tracking-[-0.04em] text-ink-100">
        404
      </h1>
      <p className="mt-4 text-[18px] text-ink-300">
        Page not found.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/"
          className="rounded-lg bg-lime-benchlee px-4 py-2.5 text-[14px] font-semibold text-ink-950 transition-colors hover:bg-lime-dim"
        >
          Home
        </Link>
        <Link
          href="/tasks"
          className="rounded-lg border border-ink-600 px-4 py-2.5 text-[14px] font-medium text-ink-200 transition-colors hover:border-ink-500"
        >
          View benchmarks
        </Link>
      </div>
    </div>
  );
}
