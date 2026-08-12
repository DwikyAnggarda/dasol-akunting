import Link from "next/link";

import PageBreadCrumb from "@/components/common/PageBreadCrumb";

export function EntityPage({
  children,
  description,
  primaryHref,
  primaryLabel,
  title,
}: {
  children: React.ReactNode;
  description: string;
  primaryHref?: string;
  primaryLabel?: string;
  title: string;
}) {
  return (
    <div>
      <PageBreadCrumb pageTitle={title} />
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>
        {primaryHref && primaryLabel ? (
          <Link
            className="bg-brand-500 hover:bg-brand-600 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
            href={primaryHref}
          >
            {primaryLabel}
          </Link>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function FormCard({ children }: { children: React.ReactNode }) {
  return (
    <section className="shadow-theme-xs rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      {children}
    </section>
  );
}
