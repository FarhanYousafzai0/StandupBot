import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-2 border-b border-border-cream pb-6">
        <h1 className="font-display text-3xl text-near-black">Dashboard</h1>
        <p className="text-olive-gray">
          Today&apos;s activity feed will appear here (Phase 4+).
        </p>
      </header>
      <nav className="flex flex-wrap gap-3 text-sm">
        <Link
          href="/standup"
          className="rounded-lg border border-border-warm bg-warm-sand px-4 py-2 font-medium text-charcoal-warm shadow-[0_0_0_1px_#d1cfc5]"
        >
          Standup
        </Link>
        <Link
          href="/history"
          className="rounded-lg border border-border-cream bg-ivory px-4 py-2 text-olive-gray"
        >
          History
        </Link>
        <Link
          href="/settings"
          className="rounded-lg border border-border-cream bg-ivory px-4 py-2 text-olive-gray"
        >
          Settings
        </Link>
        <Link href="/" className="ml-auto text-stone-gray hover:text-olive-gray">
          Home
        </Link>
      </nav>
    </div>
  );
}
