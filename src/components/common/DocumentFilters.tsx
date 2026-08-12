import Link from "next/link";

export function DocumentFilters({
  q,
  status,
}: {
  q?: string;
  status?: string;
}) {
  const inputClass =
    "h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300";
  return (
    <form className="flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.03]">
      <input
        className={`${inputClass} min-w-56 flex-1`}
        defaultValue={q}
        name="q"
        placeholder="Cari nomor dokumen…"
        type="search"
      />
      <select className={inputClass} defaultValue={status} name="status">
        <option value="">Semua status</option>
        {[
          "draft",
          "pending_approval",
          "approved",
          "rejected",
          "posted",
          "partially_paid",
          "paid",
          "reversed",
          "voided",
        ].map((item) => (
          <option key={item} value={item}>
            {item.replaceAll("_", " ")}
          </option>
        ))}
      </select>
      <button
        className="rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white dark:bg-white dark:text-gray-900"
        type="submit"
      >
        Terapkan
      </button>
      <Link
        className="flex items-center rounded-lg border border-gray-300 px-4 text-sm font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-300"
        href="?"
      >
        Reset
      </Link>
    </form>
  );
}
