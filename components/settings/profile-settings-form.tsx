"use client";

import { useCallback, useEffect, useState } from "react";
import { api, getErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";
import type { PublicUser } from "@/types/user";

const field = cn(
  "w-full rounded-xl border border-border-cream bg-pure-white px-3 py-2.5 text-near-black shadow-[0_0_0_1px_#f0eee6] placeholder:text-stone-gray",
  "focus:border-focus-blue focus:outline-none focus:ring-2 focus:ring-focus-blue/40"
);

export function ProfileSettingsForm() {
  const setUser = useAuthStore((s) => s.setUser);
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [standupTime, setStandupTime] = useState("17:00");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ user: PublicUser }>("/api/user/me");
      const u = data.user;
      setName(u.name || "");
      setTimezone(u.timezone || "UTC");
      setStandupTime(u.standupTime || "17:00");
    } catch (e) {
      setError(getErrorMessage(e, "Could not load profile"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSaving(true);
    try {
      const { data } = await api.patch<{ user: PublicUser }>("/api/user/me", {
        name: name.trim() || undefined,
        timezone: timezone.trim(),
        standupTime,
      });
      setUser(data.user);
      setName(data.user.name);
      setTimezone(data.user.timezone);
      setStandupTime(data.user.standupTime);
      setMessage("Saved.");
    } catch (err) {
      setError(getErrorMessage(err, "Could not save"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-olive-gray">Loading profile…</p>;
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
          {error}
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
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
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
            value={toTimeInput(standupTime)}
            onChange={(e) => setStandupTime(fromTimeInput(e.target.value))}
            required
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-[10px] bg-terracotta px-4 py-2.5 text-sm font-medium text-ivory shadow-[0_0_0_1px_#c96442] disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save profile"}
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
