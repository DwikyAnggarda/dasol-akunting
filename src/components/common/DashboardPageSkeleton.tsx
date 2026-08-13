const skeletonClass = "rounded-xl bg-gray-200 dark:bg-gray-800";

export function DashboardPageSkeleton({
  label = "Memuat halaman",
}: {
  label?: string;
}) {
  return (
    <div
      aria-busy="true"
      aria-label={label}
      className="animate-pulse space-y-6"
      role="status"
    >
      <span className="sr-only">{label}</span>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <div className={`h-7 w-56 ${skeletonClass}`} />
          <div className={`h-4 w-full max-w-md ${skeletonClass}`} />
        </div>
        <div className={`h-10 w-36 ${skeletonClass}`} />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className={`h-10 w-full max-w-sm ${skeletonClass}`} />
        <div className={`h-10 w-32 ${skeletonClass}`} />
        <div className={`h-10 w-32 ${skeletonClass}`} />
      </div>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="space-y-4 p-5">
          <div className={`h-4 w-full ${skeletonClass}`} />
          {Array.from({ length: 7 }, (_, index) => (
            <div className="grid grid-cols-6 gap-4" key={index}>
              <div className={`col-span-2 h-4 ${skeletonClass}`} />
              <div className={`h-4 ${skeletonClass}`} />
              <div className={`h-4 ${skeletonClass}`} />
              <div className={`h-4 ${skeletonClass}`} />
              <div className={`h-4 ${skeletonClass}`} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
