"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "./auth-store";

function subscribe(onStoreChange: () => void) {
  const unsubFinish = useAuthStore.persist.onFinishHydration(onStoreChange);
  const unsubHydrate = useAuthStore.persist.onHydrate(onStoreChange);
  return () => {
    unsubFinish();
    unsubHydrate();
  };
}

function getSnapshot() {
  return useAuthStore.persist.hasHydrated();
}

export function useAuthHydrated() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

export function useRequireAuth(redirectTo: string) {
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (hydrated && !token) {
      router.replace(`/login?from=${encodeURIComponent(redirectTo)}`);
    }
  }, [hydrated, token, router, redirectTo]);

  return { hydrated, token };
}
