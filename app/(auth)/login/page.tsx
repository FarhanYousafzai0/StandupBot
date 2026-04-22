import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl text-near-black">Log in</h1>
        <p className="mt-2 text-sm text-olive-gray">
          StandupBot — Phase 3 will wire auth to the API.
        </p>
      </div>
      <p className="text-sm text-stone-gray">
        Placeholder screen. Use <code className="font-mono text-charcoal-warm">POST /api/auth/login</code> when the API is running.
      </p>
      <p className="text-sm text-olive-gray">
        No account?{" "}
        <Link href="/register" className="font-medium text-dark-warm underline-offset-2 hover:underline">
          Register
        </Link>
      </p>
      <Link
        href="/"
        className="text-center text-sm text-stone-gray hover:text-olive-gray"
      >
        ← Home
      </Link>
    </div>
  );
}
