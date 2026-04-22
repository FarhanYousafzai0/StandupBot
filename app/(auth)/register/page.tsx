import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl text-near-black">Create account</h1>
        <p className="mt-2 text-sm text-olive-gray">
          StandupBot — registration form comes with API integration.
        </p>
      </div>
      <p className="text-sm text-stone-gray">
        Placeholder. <code className="font-mono text-charcoal-warm">POST /api/auth/register</code>
      </p>
      <p className="text-sm text-olive-gray">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-dark-warm underline-offset-2 hover:underline">
          Log in
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
