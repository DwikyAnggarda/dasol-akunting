"use client";

import Link from "next/link";

import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import { useSidebar } from "@/context/SidebarContext";

type AppHeaderProps = {
  companyCode: string;
  companyName: string;
  userEmail: string;
};

export default function AppHeader({
  companyCode,
  companyName,
  userEmail,
}: AppHeaderProps) {
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();

  function handleToggle() {
    if (window.innerWidth >= 1024) toggleSidebar();
    else toggleMobileSidebar();
  }

  return (
    <header className="sticky top-0 z-40 flex w-full border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
      <div className="flex w-full items-center justify-between gap-4 px-4 py-3 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            aria-label={isMobileOpen ? "Tutup navigasi" : "Buka navigasi"}
            className="focus:ring-brand-500/20 grid size-11 shrink-0 place-items-center rounded-xl border border-gray-200 text-gray-500 transition hover:bg-gray-50 focus:ring-3 focus:outline-none dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800"
            onClick={handleToggle}
            type="button"
          >
            <svg
              aria-hidden
              fill="none"
              height="18"
              viewBox="0 0 20 18"
              width="20"
            >
              <path
                d="M2 4h16M2 9h10M2 14h16"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.6"
              />
            </svg>
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
              {companyName}
            </p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
              {companyCode} · {userEmail}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggleButton />
          <Link
            className="hidden rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 sm:inline-flex dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
            href="/select-company"
          >
            Ganti perusahaan
          </Link>
          <form action="/auth/signout" method="post">
            <button
              className="rounded-xl bg-gray-900 px-3.5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
              type="submit"
            >
              Keluar
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
