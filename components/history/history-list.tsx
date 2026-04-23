"use client";

import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { api, getErrorMessage } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth-hooks";
import type { Standup, StandupHistoryResponse } from "@/types/standup";

const PAGE = 20;

export function HistoryList() {
  const { hydrated, token } = useRequireAuth("/history");
  const historyQuery = useInfiniteQuery({
    queryKey: ["standups", "history"],
    enabled: hydrated && !!token,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const q = new URLSearchParams();
      q.set("limit", String(PAGE));
      if (pageParam) {
        q.set("before", pageParam);
      }
      const { data } = await api.get<StandupHistoryResponse>(
        `/api/standup/history?${q.toString()}`
      );
      return data;
    },
    getNextPageParam: (lastPage) => lastPage.nextBeforeDate,
  });

  if (!hydrated) {
    return <p className="text-sm text-olive-gray">Loading…</p>;
  }

  if (!token) {
    return <p className="text-sm text-olive-gray">Redirecting…</p>;
  }

  if (historyQuery.isPending) {
    return <p className="text-olive-gray">Loading standups…</p>;
  }

  const items = historyQuery.data?.pages.flatMap((page) => page.standups) ?? [];
  const nextBefore = historyQuery.hasNextPage
    ? historyQuery.data?.pages[historyQuery.data.pages.length - 1]?.nextBeforeDate ?? null
    : null;
  const error = historyQuery.error
    ? getErrorMessage(historyQuery.error, "Could not load history")
    : null;

  return (
    <div className="space-y-6">
      {error ? (
        <p
          className="rounded-lg border border-border-warm bg-pure-white px-3 py-2 text-sm text-error-crimson"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {items.length === 0 ? (
        <p className="text-olive-gray">
          No standups yet. Open <Link href="/standup" className="text-terracotta hover:underline">Standup</Link> to
          create one.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((s) => (
            <li
              key={s.id}
              className="rounded-xl border border-border-cream bg-ivory/80 px-4 py-3 shadow-[var(--shadow-whisper)]"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-display text-lg text-near-black">{s.date}</p>
                <span
                  className={
                    s.status === "sent"
                      ? "rounded bg-warm-sand px-2 py-0.5 text-xs text-charcoal-warm"
                      : "rounded border border-border-cream bg-pure-white px-2 py-0.5 text-xs text-olive-gray"
                  }
                >
                  {s.status === "sent" ? "Sent" : "Draft"}
                </span>
              </div>
              <p className="mt-2 line-clamp-3 text-sm text-olive-gray whitespace-pre-wrap">
                {previewText(s)}
              </p>
            </li>
          ))}
        </ul>
      )}

      {nextBefore ? (
        <button
          type="button"
          onClick={() => void historyQuery.fetchNextPage()}
          disabled={historyQuery.isFetchingNextPage}
          className="rounded-lg border border-border-warm bg-warm-sand px-4 py-2.5 text-sm font-medium text-charcoal-warm shadow-[0_0_0_1px_#d1cfc5] disabled:opacity-50"
        >
          {historyQuery.isFetchingNextPage ? "Loading…" : "Load older"}
        </button>
      ) : null}
    </div>
  );
}

function previewText(s: Standup) {
  if (s.editedContent && s.editedContent.trim()) {
    return s.editedContent.trim();
  }
  return [s.yesterday, s.today, s.blockers]
    .filter((x) => x && x.trim())
    .join(" · ")
    .trim() || "—";
}
