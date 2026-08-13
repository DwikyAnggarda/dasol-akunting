const cardClass = "rounded-2xl bg-gray-200 dark:bg-gray-800";

export default function DashboardSectionLoading() {
  return (
    <div
      aria-label="Memuat halaman"
      className="animate-pulse space-y-6"
      role="status"
    >
      <div className="space-y-3">
        <div className={`h-7 w-56 ${cardClass}`} />
        <div className={`h-4 w-full max-w-md ${cardClass}`} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div className={`h-28 ${cardClass}`} key={index} />
        ))}
      </div>
      <div className={`h-96 ${cardClass}`} />
    </div>
  );
}
