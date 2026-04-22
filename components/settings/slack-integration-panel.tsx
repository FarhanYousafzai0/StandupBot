"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { PublicIntegration, IntegrationsListResponse } from "@/types/integration";

const btn = cn(
  "rounded-[10px] px-4 py-2.5 text-sm font-medium transition",
  "bg-terracotta text-ivory shadow-[0_0_0_1px_#c96442] hover:opacity-95 disabled:opacity-50"
);
const btnGhost = cn(
  "rounded-[10px] border border-border-warm bg-warm-sand px-4 py-2.5 text-sm text-charcoal-warm hover:bg-ivory"
);

export function SlackIntegrationPanel() {
  const searchParams = useSearchParams();
  const [list, setList] = useState<PublicIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.get<IntegrationsListResponse>("/api/integrations");
      setList(data.integrations);
    } catch (e) {
      setList([]);
      setError(getErrorMessage(e, "Could not load integrations"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (searchParams.get("slack") === "connected") {
      setBanner("Slack connected. You can send standups from the Standup page (DM) or a channel ID in the API body.");
    }
    const ge = searchParams.get("slack_error");
    if (ge) {
      setBanner(`Slack: ${ge}`);
    }
  }, [searchParams]);

  async function onConnect() {
    setError(null);
    setAction("connecting");
    try {
      const { data } = await api.get<{ url: string }>(
        "/api/integrations/slack/authorize"
      );
      window.location.assign(data.url);
    } catch (e) {
      setError(getErrorMessage(e, "Could not start Slack connection"));
    } finally {
      setAction(null);
    }
  }

  async function onDisconnect(id: string) {
    if (!window.confirm("Disconnect Slack?")) {
      return;
    }
    setError(null);
    setAction("disconnect");
    try {
      await api.delete(`/api/integrations/${id}`);
      setBanner(null);
      await load();
    } catch (e) {
      setError(getErrorMessage(e, "Could not disconnect"));
    } finally {
      setAction(null);
    }
  }

  const sl = list.find((i) => i.platform === "slack");

  if (loading) {
    return <p className="text-sm text-olive-gray">Loading…</p>;
  }

  return (
    <section
      className="rounded-2xl border border-border-cream bg-ivory/80 p-6 shadow-[var(--shadow-whisper)]"
      id="slack"
    >
      <h2 className="font-display text-lg text-near-black">Slack</h2>
      <p className="mt-1 text-sm text-stone-gray">
        Install the app to your workspace. Bot needs <code className="font-mono">chat:write</code>,{" "}
        <code className="font-mono">im:write</code>, and{" "}
        <code className="font-mono">users:read</code> (see README). Sending uses your DM by
        default.
      </p>
      {banner ? (
        <p className="mt-3 text-sm text-charcoal-warm" role="status">
          {banner}
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 text-sm text-error-crimson" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {sl ? (
          <>
            <span className="text-sm text-olive-gray">
              {sl.slack?.teamName ? (
                <span className="text-near-black">{sl.slack.teamName}</span>
              ) : null}
              {sl.slack?.userName ? (
                <span className="ml-2">· {sl.slack.userName}</span>
              ) : null}
            </span>
            <button
              type="button"
              className={btnGhost}
              disabled={!!action}
              onClick={() => void onDisconnect(sl.id)}
            >
              Disconnect
            </button>
          </>
        ) : (
          <button
            type="button"
            className={btn}
            disabled={!!action}
            onClick={() => void onConnect()}
          >
            {action === "connecting" ? "Redirecting…" : "Connect Slack"}
          </button>
        )}
      </div>
    </section>
  );
}
