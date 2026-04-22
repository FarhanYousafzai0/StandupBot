import Link from "next/link";
import { Suspense } from "react";
import { GitHubIntegrationPanel } from "@/components/settings/github-integration-panel";
import { SlackIntegrationPanel } from "@/components/settings/slack-integration-panel";
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";

export default function SettingsPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <header>
        <h1 className="font-display text-3xl text-near-black">Settings</h1>
        <p className="mt-2 text-olive-gray">
          Profile, then integrations. GitHub and Slack use the redirect URLs in{" "}
          <code className="font-mono text-sm">API_PUBLIC_URL</code>.
        </p>
      </header>
      <Link href="/dashboard" className="text-sm text-stone-gray hover:text-olive-gray">
        ← Dashboard
      </Link>
      <ProfileSettingsForm />
      <Suspense
        fallback={
          <p className="text-sm text-olive-gray">Loading…</p>
        }
      >
        <GitHubIntegrationPanel />
      </Suspense>
      <Suspense
        fallback={
          <p className="text-sm text-olive-gray">Loading…</p>
        }
      >
        <SlackIntegrationPanel />
      </Suspense>
    </div>
  );
}
