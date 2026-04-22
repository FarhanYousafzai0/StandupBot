"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, getErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { isApiConfigured } from "@/lib/env";
import { cn } from "@/lib/utils";
import type { AuthResponse } from "@/types/user";

const inputClass = cn(
  "w-full rounded-xl border border-border-cream bg-pure-white px-3 py-2.5 text-near-black shadow-[0_0_0_1px_#f0eee6] placeholder:text-stone-gray",
  "focus:border-focus-blue focus:outline-none focus:ring-2 focus:ring-focus-blue/40"
);

export function RegisterForm() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isApiConfigured()) {
      setError("Set NEXT_PUBLIC_API_URL in .env.local (see .env.local.example).");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post<AuthResponse>(
        "/api/auth/register",
        {
          email,
          password,
          name: name.trim() || undefined,
        },
        { skipAuthRedirect: true }
      );
      setAuth(data.token, data.user);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(getErrorMessage(err, "Could not create account"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      <div>
        <h1 className="font-display text-2xl text-near-black">Create account</h1>
        <p className="mt-2 text-sm text-olive-gray">
          8+ character password. You can add GitHub/Slack later in Settings.
        </p>
      </div>

      {error ? (
        <p
          className="rounded-lg border border-border-warm bg-pure-white px-3 py-2 text-sm text-error-crimson"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-medium text-charcoal-warm">
          Name <span className="text-stone-gray">(optional)</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium text-charcoal-warm">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium text-charcoal-warm">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="mt-1 rounded-[10px] bg-terracotta px-4 py-3 text-sm font-medium text-ivory shadow-[0_0_0_1px_#c96442] transition hover:opacity-95 disabled:opacity-50"
      >
        {loading ? "Creating account…" : "Create account"}
      </button>
      <p className="text-sm text-olive-gray">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-dark-warm underline-offset-2 hover:underline"
        >
          Log in
        </Link>
      </p>
      <Link
        href="/"
        className="text-center text-sm text-stone-gray hover:text-olive-gray"
      >
        ← Home
      </Link>
    </form>
  );
}
