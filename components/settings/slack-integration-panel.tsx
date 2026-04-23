"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { api, getErrorMessage } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth-hooks";
import { cn } from "@/lib/utils";
import type { IntegrationsListResponse } from "@/types/integration";

const btn = cn(
  "rounded-[10px] px-4 py-2.5 text-sm font-medium transition",
  "bg-terracotta text-ivory shadow-[0_0_0_1px_#c96442] hover:opacity-95 disabled:opacity-50"
);
const btnGhost = cn(
  "rounded-[10px] border border-border-warm bg-warm-sand px-4 py-2.5 text-sm text-charcoal-warm hover:bg-ivory"
);

export function SlackIntegrationPanel() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { hydrated, token } = useRequireAuth("/settings");
  const [banner, setBanner] = useState<string | null>(null);
  const integrationsQuery = useQuery({
    queryKey: ["integrations"],
    enabled: hydrated && !!token,
    queryFn: async () => {
      const { data } = await api.get<IntegrationsListResponse>("/api/integrations");
      return data.integrations;
    },
  });
  const connectMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.get<{ url: string }>("/api/integrations/slack/authorize");
      return data.url;
    },
    onSuccess: (url) => {
      window.location.assign(url);
    },
  });
  const disconnectMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/api/integrations/${id}`),
    onSuccess: async () => {
      setBanner(null);
      await queryClient.invalidateQueries({ queryKey: ["integrations"] });
    },
  });
  const list = integrationsQuery.data ?? [];
  const derivedBanner = useMemo(() => {
    if (searchParams.get("slack") === "connected") {
      return "Slack connected. You can send standups from the Standup page (DM) or a channel ID in the API body.";
    }
    const ge = searchParams.get("slack_error");
    return ge ? `Slack: ${ge}` : null;
  }, [searchParams]);
  const action = connectMutation.isPending
    ? "connecting"
    : disconnectMutation.isPending
      ? "disconnect"
      : null;
  const error = connectMutation.error || disconnectMutation.error || integrationsQuery.error;

  async function onConnect() {
    try {
      await connectMutation.mutateAsync();
    } catch {}
  }

  async function onDisconnect(id: string) {
    if (!window.confirm("Disconnect Slack?")) {
      return;
    }
    try {
      await disconnectMutation.mutateAsync(id);
    } catch {}
  }

  const sl = list.find((i) => i.platform === "slack");

  if (!hydrated) {
    return <p className="text-sm text-olive-gray">Loading…</p>;
  }
  if (!token) {
    return <p className="text-sm text-olive-gray">Redirecting…</p>;
  }
  if (integrationsQuery.isPending) {
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
      {banner || derivedBanner ? (
        <p className="mt-3 text-sm text-charcoal-warm" role="status">
          {banner || derivedBanner}
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 text-sm text-error-crimson" role="alert">
          {getErrorMessage(error, "Could not load integrations")}
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
