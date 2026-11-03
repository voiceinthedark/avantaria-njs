import { Suspense } from "react";
import type { Metadata } from "next";
import { DashboardNav } from "./_components/dashboard-nav";
import { UserMenu } from "./_components/user-menu";

export const metadata: Metadata = { title: "Dashboard · Avantaria Store" };

/**
 * The layout itself reads nothing from the request, so the shell prerenders.
 * The session-dependent part streams in behind <Suspense>. Layouts don't
 * re-render on navigation, so authorization is enforced again in every
 * page (see requireStaffUser in lib/auth/dal.ts), not here.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <aside className="flex flex-col gap-6 border-b border-foreground/10 p-4 md:w-56 md:border-r md:border-b-0">
        <span className="text-base font-semibold">Avantaria</span>
        {/* usePathname() is request data on dynamic routes, so it needs a boundary. */}
        <Suspense fallback={<div className="h-10" />}>
          <DashboardNav />
        </Suspense>
        <div className="md:mt-auto">
          <Suspense fallback={<div className="h-12" />}>
            <UserMenu />
          </Suspense>
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
