import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-gray-50 px-6 dark:bg-gray-950">
      <div className="max-w-lg text-center">
        <p className="text-brand-600 text-sm font-semibold tracking-widest uppercase">
          403
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-gray-900 dark:text-white">
          Akses tidak diizinkan
        </h1>
        <p className="mt-3 text-gray-500 dark:text-gray-400">
          Akun Anda tidak memiliki izin untuk perusahaan atau tindakan ini.
        </p>
        <Link
          className="bg-brand-500 hover:bg-brand-600 mt-7 inline-flex rounded-xl px-5 py-3 text-sm font-semibold text-white"
          href="/dashboard"
        >
          Kembali ke Dasbor
        </Link>
      </div>
    </main>
  );
}
