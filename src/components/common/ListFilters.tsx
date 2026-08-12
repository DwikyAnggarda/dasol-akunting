import Link from "next/link";

export function ListFilters({
  active,
  q,
  type,
  typeOptions,
}: {
  active?: string;
  q?: string;
  type?: string;
  typeOptions?: { label: string; value: string }[];
}) {
  const inputClass =
    "h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300";
  return (
    <form className="flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.03]">
      <input
        className={`${inputClass} min-w-56 flex-1`}
        defaultValue={q}
        name="q"
        placeholder="Cari kode atau nama…"
        type="search"
      />
      {typeOptions ? (
        <select className={inputClass} defaultValue={type} name="type">
          <option value="">Semua tipe</option>
          {typeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : null}
      <select className={inputClass} defaultValue={active} name="active">
        <option value="">Semua status</option>
        <option value="active">Aktif</option>
        <option value="inactive">Nonaktif</option>
      </select>
      <button
        className="rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900"
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
