export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border-cream bg-ivory p-8 shadow-[var(--shadow-whisper)]">
        {children}
      </div>
    </div>
  );
}
