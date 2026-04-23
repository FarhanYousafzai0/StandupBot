"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Activity, ActivityListResponse } from "@/types/activity";
import {
  ACTIVITY_SOURCE_ORDER,
  getActivitySourceLabel,
} from "@/lib/activity-source";

const inputClass = cn(
  "w-full rounded-xl border border-border-cream bg-pure-white px-3 py-2 text-near-black shadow-[0_0_0_1px_#f0eee6] placeholder:text-stone-gray",
  "focus:border-focus-blue focus:outline-none focus:ring-2 focus:ring-focus-blue/40"
);

export function ActivityPanel() {
  const [formError, setFormError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isBlocker, setIsBlocker] = useState(false);
  const queryClient = useQueryClient();
  const activityQuery = useQuery({
    queryKey: ["activity", "today"],
    queryFn: async () => {
      const { data } = await api.get<ActivityListResponse>("/api/activity/today");
      return data;
    },
  });
  const createMutation = useMutation({
    mutationFn: async () =>
      api.post("/api/activity", {
        source: "manual",
        type: "note",
        title: title.trim(),
        description: description.trim(),
        url: "",
        isBlocker,
      }),
    onSuccess: async () => {
      setTitle("");
      setDescription("");
      setIsBlocker(false);
      setFormError(null);
      await queryClient.invalidateQueries({ queryKey: ["activity", "today"] });
    },
    onError: (err) => {
      setFormError(getErrorMessage(err, "Could not save"));
    },
  });
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/api/activity/${id}`),
    onSuccess: async () => {
      setFormError(null);
      await queryClient.invalidateQueries({ queryKey: ["activity", "today"] });
    },
    onError: (err) => {
      setFormError(getErrorMessage(err, "Could not delete"));
    },
  });
  const data = activityQuery.data ?? null;

  const bySource = useMemo(() => {
    if (!data?.activities) {
      return new Map<string, Activity[]>();
    }
    const m = new Map<string, Activity[]>();
    for (const a of data.activities) {
      const k = a.source;
      if (!m.has(k)) {
        m.set(k, []);
      }
      m.get(k)!.push(a);
    }
    for (const arr of m.values()) {
      arr.sort(
        (x, y) => new Date(y.timestamp).getTime() - new Date(x.timestamp).getTime()
      );
    }
    return m;
  }, [data]);

  const sourceKeys = useMemo(() => {
    const keys = new Set(bySource.keys());
    const out: string[] = [];
    for (const s of ACTIVITY_SOURCE_ORDER) {
      if (keys.has(s)) {
        out.push(s);
        keys.delete(s);
      }
    }
    for (const s of keys) {
      out.push(s);
    }
    return out;
  }, [bySource]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!title.trim()) {
      setFormError("Add a short title for this activity.");
      return;
    }
    await createMutation.mutateAsync();
  }

  async function onDelete(id: string) {
    setFormError(null);
    await deleteMutation.mutateAsync(id);
  }

  return (
    <section className="space-y-6 rounded-2xl border border-border-cream bg-ivory/80 p-6 shadow-[var(--shadow-whisper)]">
      <div>
        <h2 className="font-display text-xl text-near-black">Today&apos;s activity</h2>
        {data ? (
          <p className="mt-1 text-sm text-stone-gray">
            {data.date} · {data.timezone}
          </p>
        ) : null}
      </div>

      {formError ? (
        <p
          className="rounded-lg border border-border-warm bg-pure-white px-3 py-2 text-sm text-error-crimson"
          role="alert"
        >
          {formError}
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label htmlFor="act-title" className="text-sm font-medium text-charcoal-warm">
            Log something (manual)
          </label>
          <input
            id="act-title"
            className={cn("mt-1", inputClass)}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Reviewed API design with team"
            maxLength={500}
            required
          />
        </div>
        <div>
          <label htmlFor="act-desc" className="text-sm font-medium text-charcoal-warm">
            Detail <span className="text-stone-gray">(optional)</span>
          </label>
          <textarea
            id="act-desc"
            className={cn("mt-1 min-h-[88px] resize-y", inputClass)}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={20000}
            placeholder="Extra context for your standup"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-olive-gray">
          <input
            type="checkbox"
            checked={isBlocker}
            onChange={(e) => setIsBlocker(e.target.checked)}
            className="h-4 w-4 rounded border-border-warm text-terracotta focus:ring-focus-blue"
          />
          Mark as a blocker
        </label>
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="rounded-[10px] bg-terracotta px-4 py-2.5 text-sm font-medium text-ivory shadow-[0_0_0_1px_#c96442] disabled:opacity-50"
        >
          {createMutation.isPending ? "Saving…" : "Add to today"}
        </button>
      </form>

      <div>
        <h3 className="text-sm font-medium text-charcoal-warm">Feed (by source)</h3>
        {activityQuery.isPending ? (
          <p className="mt-2 text-sm text-olive-gray">Loading…</p>
        ) : activityQuery.error ? (
          <p className="mt-2 text-sm text-error-crimson">
            {getErrorMessage(activityQuery.error, "Could not load activities")}
          </p>
        ) : data && data.activities.length === 0 ? (
          <p className="mt-2 text-sm text-olive-gray">No activity yet. Add a line above.</p>
        ) : (
          <div className="mt-3 space-y-6">
            {sourceKeys.map((source) => (
              <div key={source}>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-stone-gray">
                  {getActivitySourceLabel(source)}
                </h4>
                <ul className="mt-2 space-y-2">
                  {bySource.get(source)?.map((a) => (
                    <ActivityRow
                      key={a.id}
                      activity={a}
                      onDelete={onDelete}
                      busy={deleteMutation.isPending && deleteMutation.variables === a.id}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ActivityRow({
  activity: a,
  onDelete,
  busy,
}: {
  activity: Activity;
  onDelete: (id: string) => void;
  busy: boolean;
}) {
  const time = new Date(a.timestamp).toLocaleString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <li className="flex gap-3 rounded-lg border border-border-cream bg-pure-white px-3 py-2 text-sm">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-near-black">{a.title}</p>
        {a.description ? (
          <p className="mt-0.5 text-olive-gray whitespace-pre-wrap">{a.description}</p>
        ) : null}
        <p className="mt-1 text-xs text-stone-gray">
          {a.type} · {time}
          {a.isBlocker ? (
            <span className="ml-2 rounded bg-warm-sand px-1.5 py-0.5 text-error-crimson">
              Blocker
            </span>
          ) : null}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onDelete(a.id)}
        disabled={busy}
        className="h-fit shrink-0 self-start text-xs text-stone-gray underline-offset-2 hover:text-error-crimson hover:underline disabled:opacity-50"
      >
        {busy ? "…" : "Delete"}
      </button>
    </li>
  );
}
