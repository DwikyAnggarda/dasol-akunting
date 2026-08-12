import PageBreadCrumb from "@/components/common/PageBreadCrumb";

export type TableColumn<Row> = {
  align?: "left" | "right";
  key: keyof Row;
  label: string;
  render?: (value: Row[keyof Row], row: Row) => React.ReactNode;
};

type ModulePageProps<Row extends { id: string }> = {
  actions?: React.ReactNode;
  columns: TableColumn<Row>[];
  description: string;
  emptyAction?: React.ReactNode;
  emptyDescription: string;
  emptyTitle: string;
  filters?: React.ReactNode;
  rows: Row[];
  successMessage?: string;
  title: string;
  trailing?: React.ReactNode;
};

export function StatusBadge({ value }: { value: string }) {
  const normalized = value.toLowerCase();
  const tone =
    normalized === "posted" ||
    normalized === "paid" ||
    normalized === "approved" ||
    normalized === "active"
      ? "bg-success-50 text-success-700 dark:bg-success-950/30 dark:text-success-300"
      : normalized === "rejected" || normalized === "voided"
        ? "bg-error-50 text-error-700 dark:bg-error-950/30 dark:text-error-300"
        : "bg-warning-50 text-warning-700 dark:bg-warning-950/30 dark:text-warning-300";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${tone}`}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}

export function ModulePage<Row extends { id: string }>({
  actions,
  columns,
  description,
  emptyAction,
  emptyDescription,
  emptyTitle,
  filters,
  rows,
  successMessage,
  title,
  trailing,
}: ModulePageProps<Row>) {
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
        {actions}
      </div>
      {successMessage ? (
        <p
          className="border-success-200 bg-success-50 text-success-700 dark:border-success-900 dark:bg-success-950/30 dark:text-success-300 mb-4 rounded-xl border px-4 py-3 text-sm"
          role="status"
        >
          {successMessage}
        </p>
      ) : null}
      {filters ? <div className="mb-4">{filters}</div> : null}
      <section className="shadow-theme-xs overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {rows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-gray-100 text-xl text-gray-400 dark:bg-gray-800">
              —
            </div>
            <h2 className="mt-4 font-semibold text-gray-900 dark:text-white">
              {emptyTitle}
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-gray-500 dark:text-gray-400">
              {emptyDescription}
            </p>
            {emptyAction ? <div className="mt-5">{emptyAction}</div> : null}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/60 text-left text-xs font-semibold tracking-wider text-gray-400 uppercase dark:border-gray-800 dark:bg-white/[0.02]">
                <tr>
                  {columns.map((column) => (
                    <th
                      className={`px-5 py-3.5 ${column.align === "right" ? "text-right" : "text-left"}`}
                      key={String(column.key)}
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {rows.map((row) => (
                  <tr
                    className="transition hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                    key={row.id}
                  >
                    {columns.map((column) => (
                      <td
                        className={`px-5 py-4 text-gray-600 dark:text-gray-300 ${column.align === "right" ? "text-right" : "text-left"}`}
                        key={String(column.key)}
                      >
                        {column.render
                          ? column.render(row[column.key], row)
                          : String(row[column.key] ?? "—")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {trailing}
    </div>
  );
}
