"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import {
  DashboardNavigationContent,
  DashboardNavigationProvider,
} from "@/components/layout/dashboard-navigation";

type DashboardShellProps = {
  children: React.ReactNode;
  companyCode: string;
  companyName: string;
  permissions: string[];
  userEmail: string;
};

export function DashboardShell({
  children,
  companyCode,
  companyName,
  permissions,
  userEmail,
}: DashboardShellProps) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
      ? "lg:ml-[290px]"
      : "lg:ml-[90px]";

  return (
    <DashboardNavigationProvider>
      <div className="min-h-screen bg-gray-50 xl:flex dark:bg-gray-950">
        <AppSidebar permissions={permissions} />
        <Backdrop />
        <div
          className={`min-w-0 flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}
        >
          <AppHeader
            companyCode={companyCode}
            companyName={companyName}
            userEmail={userEmail}
          />
          <main
            aria-live="polite"
            className="mx-auto max-w-(--breakpoint-2xl) p-4 md:p-6"
          >
            <DashboardNavigationContent>{children}</DashboardNavigationContent>
          </main>
        </div>
      </div>
    </DashboardNavigationProvider>
  );
}
