import Link from "next/link";
import { Suspense } from "react";
import { HistoryList } from "@/components/history/history-list";

export default function HistoryPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <header>
        <h1 className="font-display text-3xl text-near-black">History</h1>
        <p className="mt-2 text-olive-gray">
          Past standups, newest first. Use <strong>Load older</strong> to pull the
          next page.
        </p>
      </header>
      <Link href="/dashboard" className="text-sm text-stone-gray hover:text-olive-gray">
        ← Dashboard
      </Link>
      <Suspense fallback={<p className="text-sm text-olive-gray">Loading…</p>}>
        <HistoryList />
      </Suspense>
    </div>
  );
}
