import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/lib/query-provider";

export const metadata: Metadata = {
  title: "StandupBot",
  description: "Developer standups from your real work — daily drafts, human edits, send to Slack.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-parchment text-near-black font-sans leading-[1.6] antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
