import { StandupPageClient } from "@/components/standup/standup-page-client";

export default function StandupPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <header>
        <h1 className="font-display text-3xl text-near-black">Standup</h1>
        <p className="mt-2 text-olive-gray">
          Generate a draft with <strong>OpenAI</strong> from today&apos;s activity, edit it, save changes,
          and send the final version to Slack.
        </p>
      </header>
      <StandupPageClient />
    </div>
  );
}
