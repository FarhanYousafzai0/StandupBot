"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getErrorMessage } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth-hooks";
import { useAuthStore } from "@/lib/auth-store";
import type { PublicUser } from "@/types/user";
import { ActivityPanel } from "@/components/activity/activity-panel";

export function DashboardHome() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hydrated, token } = useRequireAuth("/dashboard");
  const storedUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const userQuery = useQuery({
    queryKey: ["me"],
    enabled: hydrated && !!token,
    queryFn: async () => {
      const { data } = await api.get<{ user: PublicUser }>("/api/user/me");
      setUser(data.user);
      return data.user;
    },
  });

  if (!hydrated) {
    return (
      <p className="text-olive-gray" aria-live="polite">
        Loading…
      </p>
    );
  }

  if (!token) {
    return (
      <p className="text-sm text-olive-gray" aria-live="polite">
        Redirecting to sign in…
      </p>
    );
  }

  if (userQuery.isPending) {
    return (
      <p className="text-olive-gray" aria-live="polite">
        Loading your profile…
      </p>
    );
  }

  const user = userQuery.data ?? storedUser;
  const displayName = user?.name?.trim() || user?.email || "there";
  const loadError = userQuery.error
    ? getErrorMessage(userQuery.error, "Could not load profile")
    : null;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2 border-b border-border-cream pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl text-near-black">Dashboard</h1>
          <p className="mt-2 text-lg text-olive-gray">
            Hello, <span className="text-charcoal-warm">{displayName}</span>
          </p>
          {user ? (
            <p className="mt-1 text-sm text-stone-gray">
              Signed in as <span className="text-olive-gray">{user.email}</span>
              {user.timezone && user.timezone !== "UTC" ? (
                <> · {user.timezone}</>
              ) : null}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => {
            clearAuth();
            queryClient.clear();
            router.push("/login");
            router.refresh();
          }}
          className="w-fit rounded-lg border border-border-warm bg-warm-sand px-4 py-2 text-sm font-medium text-charcoal-warm shadow-[0_0_0_1px_#d1cfc5] hover:bg-ivory"
        >
          Log out
        </button>
      </header>

      {loadError ? (
        <p className="rounded-lg border border-border-warm bg-pure-white px-3 py-2 text-sm text-error-crimson" role="alert">
          {loadError}
        </p>
      ) : null}

      <ActivityPanel />

      <nav className="flex flex-wrap gap-3 text-sm">
        <Link
          href="/standup"
          className="rounded-lg border border-border-warm bg-warm-sand px-4 py-2 font-medium text-charcoal-warm shadow-[0_0_0_1px_#d1cfc5]"
        >
          Standup
        </Link>
        <Link
          href="/history"
          className="rounded-lg border border-border-cream bg-ivory px-4 py-2 text-olive-gray"
        >
          History
        </Link>
        <Link
          href="/settings"
          className="rounded-lg border border-border-cream bg-ivory px-4 py-2 text-olive-gray"
        >
          Settings
        </Link>
        <Link href="/" className="ml-auto text-stone-gray hover:text-olive-gray">
          Home
        </Link>
      </nav>
    </div>
  );
}
