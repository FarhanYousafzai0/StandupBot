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

export function GitHubIntegrationPanel() {
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
    if (searchParams.get("github") === "connected") {
      setBanner("GitHub connected. You can sync to pull recent events into activity.");
    }
    const ge = searchParams.get("github_error");
    if (ge) {
      setBanner(`GitHub error: ${ge}`);
    }
  }, [searchParams]);

  async function onConnect() {
    setError(null);
    setAction("connecting");
    try {
      const { data } = await api.get<{ url: string }>(
        "/api/integrations/github/authorize"
      );
      window.location.assign(data.url);
    } catch (e) {
      setError(getErrorMessage(e, "Could not start GitHub connection"));
    } finally {
      setAction(null);
    }
  }

  async function onSync() {
    setError(null);
    setAction("syncing");
    try {
      const { data } = await api.post<{ created: number }>(
        "/api/integrations/github/sync"
      );
      setBanner(
        `Synced. ${data.created} new activit${data.created === 1 ? "y" : "ies"}.`
      );
      await load();
    } catch (e) {
      setError(getErrorMessage(e, "Sync failed"));
    } finally {
      setAction(null);
    }
  }

  async function onDisconnect(id: string) {
    if (!window.confirm("Disconnect GitHub?")) {
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

  const gh = list.find((i) => i.platform === "github");

  if (loading) {
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
      {banner ? (
        <p className="mt-3 text-sm text-charcoal-warm" role="status">
          {banner}
        </p>
      ) : null}
      {error ? (
        <p
          className="mt-3 text-sm text-error-crimson"
          role="alert"
        >
          {error}
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
