"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, getErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { Standup, StandupHistoryResponse } from "@/types/standup";

const PAGE = 20;

function useHasHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
  }, []);
  return hydrated;
}

export function HistoryList() {
  const router = useRouter();
  const hydrated = useHasHydrated();
  const token = useAuthStore((s) => s.token);
  const [items, setItems] = useState<Standup[]>([]);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (append: boolean, before: string | null) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);
      try {
        const q = new URLSearchParams();
        q.set("limit", String(PAGE));
        if (before) {
          q.set("before", before);
        }
        const { data } = await api.get<StandupHistoryResponse>(
          `/api/standup/history?${q.toString()}`
        );
        if (append) {
          setItems((prev) => [...prev, ...data.standups]);
        } else {
          setItems(data.standups);
        }
        setNextBefore(data.nextBeforeDate);
      } catch (e) {
        setError(getErrorMessage(e, "Could not load history"));
        if (!append) {
          setItems([]);
        }
        setNextBefore(null);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    if (!token) {
      router.replace("/login?from=/history");
      return;
    }
    void load(false, null);
  }, [hydrated, token, router, load]);

  if (!hydrated) {
    return <p className="text-sm text-olive-gray">Loading…</p>;
  }

  if (!token) {
    return <p className="text-sm text-olive-gray">Redirecting…</p>;
  }

  if (loading) {
    return <p className="text-olive-gray">Loading standups…</p>;
  }

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
          onClick={() => void load(true, nextBefore)}
          disabled={loadingMore}
          className="rounded-lg border border-border-warm bg-warm-sand px-4 py-2.5 text-sm font-medium text-charcoal-warm shadow-[0_0_0_1px_#d1cfc5] disabled:opacity-50"
        >
          {loadingMore ? "Loading…" : "Load older"}
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
