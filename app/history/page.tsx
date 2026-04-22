import Link from "next/link";

export default function HistoryPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <header>
        <h1 className="font-display text-3xl text-near-black">History</h1>
        <p className="mt-2 text-olive-gray">
          Past standups list (paginated) — Phase 8.
        </p>
      </header>
      <Link href="/dashboard" className="text-sm text-stone-gray hover:text-olive-gray">
        ← Dashboard
      </Link>
    </div>
  );
}
