"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Standup, StandupResponse, StandupTodayResponse } from "@/types/standup";

const area = cn(
  "w-full rounded-xl border border-border-cream bg-pure-white px-3 py-2 text-near-black shadow-[0_0_0_1px_#f0eee6] placeholder:text-stone-gray",
  "min-h-[120px] font-sans text-sm leading-relaxed",
  "focus:border-focus-blue focus:outline-none focus:ring-2 focus:ring-focus-blue/40"
);

export function StandupPageClient() {
  const [date, setDate] = useState<string>("");
  const [standup, setStandup] = useState<Standup | null>(null);
  const [yesterday, setYesterday] = useState("");
  const [today, setToday] = useState("");
  const [blockers, setBlockers] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [id, setId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<StandupTodayResponse>("/api/standup/today");
      setDate(data.date);
      if (data.standup) {
        const s = data.standup;
        setStandup(s);
        setId(s.id);
        setYesterday(s.yesterday);
        setToday(s.today);
        setBlockers(s.blockers);
      } else {
        setStandup(null);
        setId(null);
        setYesterday("");
        setToday("");
        setBlockers("");
      }
    } catch (e) {
      setError(getErrorMessage(e, "Could not load standup"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onGenerate() {
    setError(null);
    setGenerating(true);
    try {
      const { data } = await api.post<{ standup: Standup }>("/api/standup/generate", {});
      const s = data.standup;
      setStandup(s);
      setId(s.id);
      setDate(s.date);
      setYesterday(s.yesterday);
      setToday(s.today);
      setBlockers(s.blockers);
    } catch (e) {
      setError(getErrorMessage(e, "Could not generate standup (check OPENAI_API_KEY on the server)"));
    } finally {
      setGenerating(false);
    }
  }

  async function onSendSlack() {
    if (!id) {
      setError("Generate a standup first.");
      return;
    }
    setError(null);
    setSending(true);
    try {
      const { data } = await api.post<StandupResponse>(`/api/standup/${id}/send`, {});
      setStandup(data.standup);
    } catch (e) {
      setError(getErrorMessage(e, "Could not send to Slack (connect Slack in Settings)"));
    } finally {
      setSending(false);
    }
  }

  async function onSave() {
    if (!id) {
      setError("Generate a standup first.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const { data } = await api.put<{ standup: Standup }>(`/api/standup/${id}`, {
        yesterday,
        today,
        blockers,
        editedContent: "",
      });
      setStandup(data.standup);
    } catch (e) {
      setError(getErrorMessage(e, "Could not save"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-olive-gray">Loading…</p>;
  }

  return (
    <div className="space-y-8">
      {error ? (
        <p
          className="rounded-lg border border-border-warm bg-pure-white px-3 py-2 text-sm text-error-crimson"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {date ? (
        <p className="text-sm text-stone-gray">
          Date: <span className="text-charcoal-warm">{date}</span> (your profile timezone)
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void onGenerate()}
          disabled={generating}
          className="rounded-[10px] bg-terracotta px-4 py-2.5 text-sm font-medium text-ivory shadow-[0_0_0_1px_#c96442] disabled:opacity-50"
        >
          {generating ? "Generating…" : standup ? "Regenerate from today’s activity" : "Generate with ChatGPT"}
        </button>
        {standup && id ? (
          <button
            type="button"
            onClick={() => void onSave()}
            disabled={saving}
            className="rounded-lg border border-border-warm bg-warm-sand px-4 py-2.5 text-sm font-medium text-charcoal-warm shadow-[0_0_0_1px_#d1cfc5] disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save edits"}
          </button>
        ) : null}
        {standup && id ? (
          <button
            type="button"
            onClick={() => void onSendSlack()}
            disabled={sending}
            className="rounded-[10px] border border-border-cream bg-pure-white px-4 py-2.5 text-sm font-medium text-charcoal-warm shadow-[0_0_0_1px_#e8e6de] disabled:opacity-50"
          >
            {sending ? "Sending…" : "Send to Slack (DM)"}
          </button>
        ) : null}
      </div>

      <p className="text-sm text-olive-gray">
        Model: OpenAI (set <code className="font-mono">OPENAI_API_KEY</code> and optional{" "}
        <code className="font-mono">OPENAI_MODEL</code> in <code className="font-mono">apps/api/.env</code>).
        Uses today&apos;s <strong>Activity</strong> items from the dashboard.
      </p>

      {standup || yesterday || today || blockers ? (
        <div className="space-y-4 rounded-2xl border border-border-cream bg-ivory p-6 shadow-[var(--shadow-whisper)]">
          <div>
            <h2 className="font-display text-lg text-near-black">✅ Yesterday</h2>
            <textarea
              className={cn("mt-2", area)}
              value={yesterday}
              onChange={(e) => setYesterday(e.target.value)}
              rows={5}
            />
          </div>
          <div>
            <h2 className="font-display text-lg text-near-black">🔨 Today</h2>
            <textarea className={cn("mt-2", area)} value={today} onChange={(e) => setToday(e.target.value)} rows={5} />
          </div>
          <div>
            <h2 className="font-display text-lg text-near-black">🚧 Blockers</h2>
            <textarea
              className={cn("mt-2", area)}
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              rows={4}
            />
          </div>
        </div>
      ) : (
        <p className="text-olive-gray">
          No standup yet. Add activity on the dashboard, then click <strong>Generate with ChatGPT</strong>.
        </p>
      )}

      <Link href="/dashboard" className="inline-block text-sm text-stone-gray hover:text-olive-gray">
        ← Dashboard
      </Link>
    </div>
  );
}
