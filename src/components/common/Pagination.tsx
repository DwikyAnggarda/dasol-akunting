import Link from "next/link";

export function Pagination({
  hasNext,
  page,
  searchParams,
}: {
  hasNext: boolean;
  page: number;
  searchParams: Record<string, string | undefined>;
}) {
  const href = (target: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && key !== "page") params.set(key, value);
    });
    params.set("page", String(target));
    return `?${params.toString()}`;
  };
  const linkClass =
    "rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300";

  if (page === 1 && !hasNext) return null;
  return (
    <nav
      aria-label="Pagination"
      className="mt-4 flex items-center justify-between"
    >
      <span className="text-sm text-gray-500">Halaman {page}</span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link className={linkClass} href={href(page - 1)}>
            Sebelumnya
          </Link>
        ) : null}
        {hasNext ? (
          <Link className={linkClass} href={href(page + 1)}>
            Berikutnya
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
