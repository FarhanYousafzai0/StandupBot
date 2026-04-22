"use client";

import { useCallback, useEffect, useState } from "react";
import { api, getErrorMessage } from "@/lib/api";
import { isApiConfigured } from "@/lib/env";
import { cn } from "@/lib/utils";
import type { Activity, ActivityListResponse } from "@/types/activity";

const inputClass = cn(
  "w-full rounded-xl border border-border-cream bg-pure-white px-3 py-2 text-near-black shadow-[0_0_0_1px_#f0eee6] placeholder:text-stone-gray",
  "focus:border-focus-blue focus:outline-none focus:ring-2 focus:ring-focus-blue/40"
);

export function ActivityPanel() {
  const [data, setData] = useState<ActivityListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isBlocker, setIsBlocker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isApiConfigured()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data: res } = await api.get<ActivityListResponse>("/api/activity/today");
      setData(res);
    } catch (e) {
      setData(null);
      setFormError(getErrorMessage(e, "Could not load activities"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!title.trim()) {
      setFormError("Add a short title for this activity.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/api/activity", {
        source: "manual",
        type: "note",
        title: title.trim(),
        description: description.trim(),
        url: "",
        isBlocker,
      });
      setTitle("");
      setDescription("");
      setIsBlocker(false);
      await load();
    } catch (err) {
      setFormError(getErrorMessage(err, "Could not save"));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    setFormError(null);
    setDeleting(id);
    try {
      await api.delete(`/api/activity/${id}`);
      await load();
    } catch (err) {
      setFormError(getErrorMessage(err, "Could not delete"));
    } finally {
      setDeleting(null);
    }
  }

  if (!isApiConfigured()) {
    return (
      <p className="text-sm text-olive-gray">
        Set <code className="font-mono text-sm">NEXT_PUBLIC_API_URL</code> to use activities.
      </p>
    );
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
          disabled={saving}
          className="rounded-[10px] bg-terracotta px-4 py-2.5 text-sm font-medium text-ivory shadow-[0_0_0_1px_#c96442] disabled:opacity-50"
        >
          {saving ? "Saving…" : "Add to today"}
        </button>
      </form>

      <div>
        <h3 className="text-sm font-medium text-charcoal-warm">Feed</h3>
        {loading ? (
          <p className="mt-2 text-sm text-olive-gray">Loading…</p>
        ) : data && data.activities.length === 0 ? (
          <p className="mt-2 text-sm text-olive-gray">No activity yet. Add a line above.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {data?.activities.map((a) => (
              <ActivityRow
                key={a.id}
                activity={a}
                onDelete={onDelete}
                busy={deleting === a.id}
              />
            ))}
          </ul>
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
          {time}
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
