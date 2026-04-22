import Link from "next/link";

export default function SettingsPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <header>
        <h1 className="font-display text-3xl text-near-black">Settings</h1>
        <p className="mt-2 text-olive-gray">
          Integrations (GitHub, Slack), timezone, standup time — Phase 6–8.
        </p>
      </header>
      <Link href="/dashboard" className="text-sm text-stone-gray hover:text-olive-gray">
        ← Dashboard
      </Link>
    </div>
  );
}
