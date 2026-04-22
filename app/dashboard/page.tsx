import { DashboardHome } from "@/components/dashboard/dashboard-home";

export default function DashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <DashboardHome />
    </div>
  );
}
