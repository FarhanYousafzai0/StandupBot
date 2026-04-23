"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getErrorMessage } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth-hooks";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";
import type { PublicUser } from "@/types/user";

const field = cn(
  "w-full rounded-xl border border-border-cream bg-pure-white px-3 py-2.5 text-near-black shadow-[0_0_0_1px_#f0eee6] placeholder:text-stone-gray",
  "focus:border-focus-blue focus:outline-none focus:ring-2 focus:ring-focus-blue/40"
);

export function ProfileSettingsForm() {
  const queryClient = useQueryClient();
  const { hydrated, token } = useRequireAuth("/settings");
  const setUser = useAuthStore((s) => s.setUser);
  const [draft, setDraft] = useState<{
    name: string;
    timezone: string;
    standupTime: string;
  } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const profileQuery = useQuery({
    queryKey: ["me"],
    enabled: hydrated && !!token,
    queryFn: async () => {
      const { data } = await api.get<{ user: PublicUser }>("/api/user/me");
      return data.user;
    },
  });
  const saveMutation = useMutation({
    mutationFn: async (values: { name: string; timezone: string; standupTime: string }) => {
      const { data } = await api.patch<{ user: PublicUser }>("/api/user/me", {
        name: values.name.trim() || undefined,
        timezone: values.timezone.trim(),
        standupTime: values.standupTime,
      });
      return data.user;
    },
    onSuccess: async (user) => {
      setUser(user);
      setDraft({
        name: user.name || "",
        timezone: user.timezone || "UTC",
        standupTime: user.standupTime || "17:00",
      });
      setMessage("Saved.");
      await queryClient.setQueryData(["me"], user);
    },
    onError: () => {
      setMessage(null);
    },
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!values) {
      return;
    }
    await saveMutation.mutateAsync(values);
  }

  if (!hydrated) {
    return <p className="text-sm text-olive-gray">Loading profile…</p>;
  }
  if (!token) {
    return <p className="text-sm text-olive-gray">Redirecting…</p>;
  }
  if (profileQuery.isPending) {
    return <p className="text-sm text-olive-gray">Loading profile…</p>;
  }

  const values = draft ?? (profileQuery.data
    ? {
        name: profileQuery.data.name || "",
        timezone: profileQuery.data.timezone || "UTC",
        standupTime: profileQuery.data.standupTime || "17:00",
      }
    : null);
  const error = saveMutation.error || profileQuery.error;

  function updateDraft(patch: Partial<NonNullable<typeof values>>) {
    if (!values) {
      return;
    }
    setDraft({ ...values, ...patch });
  }

  return (
    <section className="space-y-4 rounded-2xl border border-border-cream bg-ivory/80 p-6 shadow-[var(--shadow-whisper)]">
      <div>
        <h2 className="font-display text-lg text-near-black">Profile &amp; schedule</h2>
        <p className="mt-1 text-sm text-stone-gray">
          Timezone drives “today” for activity and standups. Standup time is used by the
          auto-draft job (quarter-hour window).
        </p>
      </div>
      {message ? (
        <p className="text-sm text-charcoal-warm" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-error-crimson" role="alert">
          {getErrorMessage(error, "Could not save")}
        </p>
      ) : null}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="profile-name" className="text-sm font-medium text-charcoal-warm">
            Display name
          </label>
          <input
            id="profile-name"
            className={cn("mt-1", field)}
            value={values?.name ?? ""}
            onChange={(e) => updateDraft({ name: e.target.value })}
            maxLength={200}
            placeholder="How we greet you on the dashboard"
            autoComplete="name"
          />
        </div>
        <div>
          <label htmlFor="tz" className="text-sm font-medium text-charcoal-warm">
            Timezone
          </label>
          <input
            id="tz"
            className={cn("mt-1", field)}
            value={values?.timezone ?? "UTC"}
            onChange={(e) => updateDraft({ timezone: e.target.value })}
            placeholder="e.g. America/Los_Angeles, Europe/Paris, UTC"
            spellCheck={false}
            required
          />
        </div>
        <div>
          <label htmlFor="st" className="text-sm font-medium text-charcoal-warm">
            Standup time (24h, local to timezone)
          </label>
          <input
            id="st"
            type="time"
            className={cn("mt-1 w-full max-w-[10rem]", field)}
            value={toTimeInput(values?.standupTime ?? "17:00")}
            onChange={(e) => updateDraft({ standupTime: fromTimeInput(e.target.value) })}
            required
          />
        </div>
        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="rounded-[10px] bg-terracotta px-4 py-2.5 text-sm font-medium text-ivory shadow-[0_0_0_1px_#c96442] disabled:opacity-50"
        >
          {saveMutation.isPending ? "Saving…" : "Save profile"}
        </button>
      </form>
    </section>
  );
}

function toTimeInput(hhmm: string) {
  const p = String(hhmm).match(/^(\d{1,2}):(\d{2})$/);
  if (!p) {
    return "17:00";
  }
  return `${p[1].padStart(2, "0")}:${p[2]}`;
}

function fromTimeInput(v: string) {
  if (!v || v.length < 4) {
    return "17:00";
  }
  const [a, b] = v.split(":");
  return `${String(parseInt(a, 10)).padStart(2, "0")}:${b}`;
}
