"use client";

export default function DashboardError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="border-error-200 bg-error-50 dark:border-error-900 dark:bg-error-950/20 rounded-2xl border p-8 text-center">
      <h1 className="text-error-800 dark:text-error-200 text-lg font-semibold">
        Dasbor belum dapat dimuat
      </h1>
      <p className="text-error-600 dark:text-error-300 mt-2 text-sm">
        Periksa koneksi dan konfigurasi database, lalu coba kembali.
      </p>
      <button
        className="bg-error-600 hover:bg-error-700 mt-5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
        onClick={reset}
        type="button"
      >
        Coba lagi
      </button>
    </div>
  );
}
