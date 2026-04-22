import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border-cream bg-parchment/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <span className="font-display text-xl tracking-tight text-near-black">
            StandupBot
          </span>
          <nav className="flex items-center gap-4 text-sm text-olive-gray">
            <Link
              href="/login"
              className="text-dark-warm hover:text-near-black"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-[10px] bg-terracotta px-4 py-2 text-pure-white shadow-[0_0_0_1px_#c96442] transition hover:opacity-95"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-8 px-4 py-16 sm:px-6">
        <h1 className="font-display max-w-2xl text-4xl leading-[1.1] text-near-black sm:text-5xl">
          Daily standups from what you actually shipped.
        </h1>
        <p className="text-lg leading-relaxed text-olive-gray">
          Connect GitHub and Slack, let activity roll in, get a{" "}
          <span className="text-charcoal-warm">draft</span> you edit — then
          send. Warm, fast, and under your control.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-[10px] bg-terracotta px-6 py-3 text-base font-medium text-ivory shadow-[0_0_0_1px_#c96442] transition hover:opacity-95"
          >
            Get started
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg border border-border-warm bg-warm-sand px-5 py-3 text-sm font-medium text-charcoal-warm shadow-[0_0_0_1px_#d1cfc5] transition hover:bg-ivory"
          >
            Open dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
