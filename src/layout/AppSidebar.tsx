"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useSidebar } from "@/context/SidebarContext";
import {
  BoxCubeIcon,
  CheckCircleIcon,
  DocsIcon,
  DollarLineIcon,
  GridIcon,
  ListIcon,
  PageIcon,
  TableIcon,
  UserCircleIcon,
} from "@/icons/index";

type NavItem = {
  icon: React.ReactNode;
  name: string;
  path: string;
  permission?: string;
};

type NavSection = { items: NavItem[]; label: string };

const navigation: NavSection[] = [
  {
    label: "Ringkasan",
    items: [
      { icon: <GridIcon />, name: "Dasbor", path: "/dashboard" },
      {
        icon: <CheckCircleIcon />,
        name: "Persetujuan",
        path: "/approvals",
        permission: "approval.read",
      },
    ],
  },
  {
    label: "Transaksi",
    items: [
      {
        icon: <DollarLineIcon />,
        name: "Penjualan",
        path: "/sales/invoices",
        permission: "sales.read",
      },
      {
        icon: <PageIcon />,
        name: "Pembelian",
        path: "/purchases/invoices",
        permission: "purchase.read",
      },
      {
        icon: <BoxCubeIcon />,
        name: "Persediaan",
        path: "/inventory/stock",
        permission: "inventory.read",
      },
    ],
  },
  {
    label: "Akuntansi",
    items: [
      {
        icon: <ListIcon />,
        name: "Daftar Akun",
        path: "/master/accounts",
        permission: "coa.read",
      },
      {
        icon: <TableIcon />,
        name: "Jurnal Umum",
        path: "/accounting/journals",
        permission: "journal.read",
      },
      {
        icon: <DocsIcon />,
        name: "Laporan",
        path: "/reports",
        permission: "report.financial.read",
      },
    ],
  },
  {
    label: "Administrasi",
    items: [
      {
        icon: <UserCircleIcon />,
        name: "Audit Log",
        path: "/audit-log",
        permission: "audit.read",
      },
      {
        icon: <GridIcon />,
        name: "Pengaturan",
        path: "/settings/company",
        permission: "settings.manage",
      },
    ],
  },
];

function isPathActive(pathname: string, path: string): boolean {
  return pathname === path || pathname.startsWith(`${path}/`);
}

export default function AppSidebar({ permissions }: { permissions: string[] }) {
  const { isExpanded, isHovered, isMobileOpen, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const permissionSet = new Set(permissions);
  const showLabels = isExpanded || isHovered || isMobileOpen;

  return (
    <aside
      className={`fixed top-0 left-0 z-50 mt-16 flex h-screen flex-col border-r border-gray-200 bg-white px-5 text-gray-900 transition-all duration-300 ease-in-out lg:mt-0 dark:border-gray-800 dark:bg-gray-900 ${
        showLabels ? "w-[290px]" : "w-[90px]"
      } ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`flex py-7 ${showLabels ? "justify-start" : "justify-center"}`}
      >
        <Link
          aria-label="Dasol"
          className="flex items-center gap-3"
          href="/dashboard"
        >
          <span className="bg-brand-500 shadow-theme-sm grid size-10 shrink-0 place-items-center rounded-2xl text-lg font-bold text-white">
            D
          </span>
          {showLabels ? (
            <span>
              <span className="block text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
                Dasol
              </span>
              <span className="block text-[10px] font-medium tracking-[0.18em] text-gray-400 uppercase">
                Accounting
              </span>
            </span>
          ) : null}
        </Link>
      </div>

      <nav
        className="no-scrollbar flex flex-1 flex-col gap-6 overflow-y-auto pb-24"
        aria-label="Navigasi utama"
      >
        {navigation.map((section) => {
          const visibleItems = section.items.filter(
            (item) => !item.permission || permissionSet.has(item.permission),
          );
          if (visibleItems.length === 0) return null;

          return (
            <section key={section.label}>
              {showLabels ? (
                <h2 className="mb-3 px-3 text-[11px] font-semibold tracking-[0.12em] text-gray-400 uppercase">
                  {section.label}
                </h2>
              ) : null}
              <ul className="space-y-1.5">
                {visibleItems.map((item) => {
                  const active = isPathActive(pathname, item.path);
                  return (
                    <li key={item.path}>
                      <Link
                        aria-current={active ? "page" : undefined}
                        className={`menu-item group ${active ? "menu-item-active" : "menu-item-inactive"} ${showLabels ? "justify-start" : "justify-center"}`}
                        href={item.path}
                        title={showLabels ? undefined : item.name}
                      >
                        <span
                          className={
                            active
                              ? "menu-item-icon-active"
                              : "menu-item-icon-inactive"
                          }
                        >
                          {item.icon}
                        </span>
                        {showLabels ? (
                          <span className="menu-item-text">{item.name}</span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </nav>
    </aside>
  );
}
