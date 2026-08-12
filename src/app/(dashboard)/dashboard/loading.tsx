export default function DashboardLoading() {
  return (
    <div
      aria-label="Memuat Dasbor"
      className="animate-pulse space-y-6"
      role="status"
    >
      <div className="h-8 w-48 rounded-lg bg-gray-200 dark:bg-gray-800" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            className="h-36 rounded-2xl bg-gray-200 dark:bg-gray-800"
            key={index}
          />
        ))}
      </div>
      <div className="h-80 rounded-2xl bg-gray-200 dark:bg-gray-800" />
    </div>
  );
}
