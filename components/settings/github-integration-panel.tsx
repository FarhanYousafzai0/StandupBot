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

export function GitHubIntegrationPanel() {
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
      const { data } = await api.get<{ url: string }>("/api/integrations/github/authorize");
      return data.url;
    },
    onSuccess: (url) => {
      window.location.assign(url);
    },
  });
  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ created: number }>("/api/integrations/github/sync");
      return data;
    },
    onSuccess: async (data) => {
      setBanner(`Synced. ${data.created} new activit${data.created === 1 ? "y" : "ies"}.`);
      await queryClient.invalidateQueries({ queryKey: ["integrations"] });
      await queryClient.invalidateQueries({ queryKey: ["activity", "today"] });
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
    if (searchParams.get("github") === "connected") {
      return "GitHub connected. You can sync to pull recent events into activity.";
    }
    const ge = searchParams.get("github_error");
    return ge ? `GitHub error: ${ge}` : null;
  }, [searchParams]);
  const action = connectMutation.isPending
    ? "connecting"
    : syncMutation.isPending
      ? "syncing"
      : disconnectMutation.isPending
        ? "disconnect"
        : null;
  const error = connectMutation.error || syncMutation.error || disconnectMutation.error || integrationsQuery.error;

  async function onConnect() {
    try {
      await connectMutation.mutateAsync();
    } catch {}
  }

  async function onSync() {
    try {
      await syncMutation.mutateAsync();
    } catch {}
  }

  async function onDisconnect(id: string) {
    if (!window.confirm("Disconnect GitHub?")) {
      return;
    }
    try {
      await disconnectMutation.mutateAsync(id);
    } catch {}
  }

  const gh = list.find((i) => i.platform === "github");

  if (!hydrated) {
    return <p className="text-sm text-olive-gray">Loading integrations…</p>;
  }
  if (!token) {
    return <p className="text-sm text-olive-gray">Redirecting…</p>;
  }
  if (integrationsQuery.isPending) {
    return <p className="text-sm text-olive-gray">Loading integrations…</p>;
  }

  return (
    <section
      className="rounded-2xl border border-border-cream bg-ivory/80 p-6 shadow-[var(--shadow-whisper)]"
      id="github"
    >
      <h2 className="font-display text-lg text-near-black">GitHub</h2>
      <p className="mt-1 text-sm text-stone-gray">
        Connect with OAuth, then we import public activity (pushes, PRs, issues) as
        standup context. Runs hourly, or use Sync.
      </p>
      {banner || derivedBanner ? (
        <p className="mt-3 text-sm text-charcoal-warm" role="status">
          {banner || derivedBanner}
        </p>
      ) : null}
      {error ? (
        <p
          className="mt-3 text-sm text-error-crimson"
          role="alert"
        >
          {getErrorMessage(error, "Could not load integrations")}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {gh ? (
          <>
            <span className="text-sm text-olive-gray">
              <span className="font-medium text-near-black">
                @{gh.github?.login || "user"}
              </span>
            </span>
            <button
              type="button"
              className={btnGhost}
              disabled={!!action}
              onClick={() => void onSync()}
            >
              {action === "syncing" ? "Syncing…" : "Sync now"}
            </button>
            <button
              type="button"
              className="text-sm text-error-crimson underline-offset-2 hover:underline"
              disabled={!!action}
              onClick={() => void onDisconnect(gh.id)}
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
            {action === "connecting" ? "Redirecting…" : "Connect GitHub"}
          </button>
        )}
      </div>
    </section>
  );
}
