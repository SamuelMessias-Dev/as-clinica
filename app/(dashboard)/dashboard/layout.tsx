import { AppHeader } from "@/components/dashboard/app-header";
import { AppSidebar } from "@/components/dashboard/app-sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen bg-background lg:flex"
      style={{ "--primary": "45 68% 51%" } as React.CSSProperties}
    >
      <AppSidebar />
      <div className="min-w-0 flex-1">
        <AppHeader />
        <main className="mx-auto w-full max-w-7xl px-4 py-5 pb-24 sm:px-6 sm:py-7 lg:px-8 lg:py-10 lg:pb-10">{children}</main>
      </div>
    </div>
  );
}
