"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getErrorMessage } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth-hooks";
import { cn } from "@/lib/utils";
import type { Standup, StandupResponse, StandupTodayResponse } from "@/types/standup";

const area = cn(
  "w-full rounded-xl border border-border-cream bg-pure-white px-3 py-2 text-near-black shadow-[0_0_0_1px_#f0eee6] placeholder:text-stone-gray",
  "min-h-[120px] font-sans text-sm leading-relaxed",
  "focus:border-focus-blue focus:outline-none focus:ring-2 focus:ring-focus-blue/40"
);

export function StandupPageClient() {
  const queryClient = useQueryClient();
  const { hydrated, token } = useRequireAuth("/standup");
  const [draft, setDraft] = useState<{
    id: string | null;
    yesterday: string;
    today: string;
    blockers: string;
  } | null>(null);
  const standupQuery = useQuery({
    queryKey: ["standup", "today"],
    enabled: hydrated && !!token,
    queryFn: async () => {
      const { data } = await api.get<StandupTodayResponse>("/api/standup/today");
      return data;
    },
  });
  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ standup: Standup }>("/api/standup/generate", {});
      return data.standup;
    },
    onSuccess: async (standup) => {
      setDraft({
        id: standup.id,
        yesterday: standup.yesterday,
        today: standup.today,
        blockers: standup.blockers,
      });
      await queryClient.setQueryData(["standup", "today"], {
        date: standup.date,
        standup,
      });
      await queryClient.invalidateQueries({ queryKey: ["standups", "history"] });
    },
  });
  const saveMutation = useMutation({
    mutationFn: async (values: { id: string; yesterday: string; today: string; blockers: string }) => {
      const { data } = await api.put<{ standup: Standup }>(`/api/standup/${values.id}`, {
        yesterday: values.yesterday,
        today: values.today,
        blockers: values.blockers,
        editedContent: "",
      });
      return data.standup;
    },
    onSuccess: async (standup) => {
      setDraft({
        id: standup.id,
        yesterday: standup.yesterday,
        today: standup.today,
        blockers: standup.blockers,
      });
      await queryClient.setQueryData(["standup", "today"], {
        date: standup.date,
        standup,
      });
      await queryClient.invalidateQueries({ queryKey: ["standups", "history"] });
    },
  });
  const sendMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<StandupResponse>(`/api/standup/${id}/send`, {});
      return data.standup;
    },
    onSuccess: async (standup) => {
      await queryClient.setQueryData(["standup", "today"], {
        date: standup.date,
        standup,
      });
      await queryClient.invalidateQueries({ queryKey: ["standups", "history"] });
    },
  });

  const date = standupQuery.data?.date ?? "";
  const standup = standupQuery.data?.standup ?? null;
  const id = draft?.id ?? standup?.id ?? null;
  const yesterday = draft && draft.id === id ? draft.yesterday : standup?.yesterday ?? "";
  const today = draft && draft.id === id ? draft.today : standup?.today ?? "";
  const blockers = draft && draft.id === id ? draft.blockers : standup?.blockers ?? "";

  async function onGenerate() {
    await generateMutation.mutateAsync();
  }

  async function onSendSlack() {
    if (!id) {
      return;
    }
    await sendMutation.mutateAsync(id);
  }

  async function onSave() {
    if (!id) {
      return;
    }
    await saveMutation.mutateAsync({ id, yesterday, today, blockers });
  }

  if (!hydrated) {
    return <p className="text-olive-gray">Loading…</p>;
  }
  if (!token) {
    return <p className="text-olive-gray">Redirecting…</p>;
  }
  if (standupQuery.isPending) {
    return <p className="text-olive-gray">Loading…</p>;
  }

  const error =
    generateMutation.error ||
    saveMutation.error ||
    sendMutation.error ||
    standupQuery.error;

  function updateDraftField(field: "yesterday" | "today" | "blockers", value: string) {
    setDraft({
      id,
      yesterday,
      today,
      blockers,
      [field]: value,
    });
  }

  return (
    <div className="space-y-8">
      {error ? (
        <p
          className="rounded-lg border border-border-warm bg-pure-white px-3 py-2 text-sm text-error-crimson"
          role="alert"
        >
          {getErrorMessage(error, "Could not load standup")}
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
          disabled={generateMutation.isPending}
          className="rounded-[10px] bg-terracotta px-4 py-2.5 text-sm font-medium text-ivory shadow-[0_0_0_1px_#c96442] disabled:opacity-50"
        >
          {generateMutation.isPending ? "Generating…" : standup ? "Regenerate from today’s activity" : "Generate with ChatGPT"}
        </button>
        {standup && id ? (
          <button
            type="button"
            onClick={() => void onSave()}
            disabled={saveMutation.isPending}
            className="rounded-lg border border-border-warm bg-warm-sand px-4 py-2.5 text-sm font-medium text-charcoal-warm shadow-[0_0_0_1px_#d1cfc5] disabled:opacity-50"
          >
            {saveMutation.isPending ? "Saving…" : "Save edits"}
          </button>
        ) : null}
        {standup && id ? (
          <button
            type="button"
            onClick={() => void onSendSlack()}
            disabled={sendMutation.isPending}
            className="rounded-[10px] border border-border-cream bg-pure-white px-4 py-2.5 text-sm font-medium text-charcoal-warm shadow-[0_0_0_1px_#e8e6de] disabled:opacity-50"
          >
            {sendMutation.isPending ? "Sending…" : "Send to Slack (DM)"}
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
              onChange={(e) => updateDraftField("yesterday", e.target.value)}
              rows={5}
            />
          </div>
          <div>
            <h2 className="font-display text-lg text-near-black">🔨 Today</h2>
            <textarea className={cn("mt-2", area)} value={today} onChange={(e) => updateDraftField("today", e.target.value)} rows={5} />
          </div>
          <div>
            <h2 className="font-display text-lg text-near-black">🚧 Blockers</h2>
            <textarea
              className={cn("mt-2", area)}
              value={blockers}
              onChange={(e) => updateDraftField("blockers", e.target.value)}
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
