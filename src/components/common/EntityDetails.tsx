export function EntityDetails({
  items,
}: {
  items: { label: string; value: React.ReactNode }[];
}) {
  return (
    <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
            {item.label}
          </dt>
          <dd className="mt-1 text-sm text-gray-800 dark:text-gray-200">
            {item.value || "—"}
          </dd>
        </div>
      ))}
    </dl>
  );
}
