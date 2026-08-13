"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { DashboardPageSkeleton } from "@/components/common/DashboardPageSkeleton";
import { getInternalNavigationPath } from "@/components/layout/dashboard-navigation-utils";

type DashboardNavigationState = {
  isNavigating: boolean;
  pendingPathname: string | null;
};

const DashboardNavigationContext = createContext<DashboardNavigationState>({
  isNavigating: false,
  pendingPathname: null,
});

function currentPath(pathname: string, searchParams: URLSearchParams): string {
  const search = searchParams.toString();
  return search ? `${pathname}?${search}` : pathname;
}

export function DashboardNavigationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const route = currentPath(pathname, searchParams);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  const onClickCapture = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || !event.currentTarget.contains(anchor)) return;

      const destination = getInternalNavigationPath(
        {
          download: anchor.hasAttribute("download"),
          href: anchor.href,
          target: anchor.getAttribute("target"),
        },
        window.location.origin,
        route,
      );
      if (destination) setPendingPath(destination);
    },
    [route],
  );

  const state = useMemo<DashboardNavigationState>(
    () => ({
      isNavigating: pendingPath !== null && pendingPath !== route,
      pendingPathname:
        pendingPath !== null && pendingPath !== route
          ? (pendingPath.split("?", 1)[0] ?? null)
          : null,
    }),
    [pendingPath, route],
  );

  return (
    <DashboardNavigationContext.Provider value={state}>
      <div onClickCapture={onClickCapture}>{children}</div>
    </DashboardNavigationContext.Provider>
  );
}

export function DashboardNavigationContent({
  children,
}: {
  children: ReactNode;
}) {
  const { isNavigating } = useDashboardNavigation();

  return isNavigating ? <DashboardPageSkeleton /> : children;
}

export function useDashboardNavigation(): DashboardNavigationState {
  return useContext(DashboardNavigationContext);
}
