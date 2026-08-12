export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.8fr)] dark:bg-gray-950">
      <section className="flex items-center justify-center px-6 py-12 sm:px-10">
        {children}
      </section>
      <aside className="relative hidden overflow-hidden bg-gray-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="bg-brand-500/20 absolute -top-24 -right-24 size-80 rounded-full blur-3xl" />
        <div className="relative">
          <span className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/75">
            Accounting integrity by design
          </span>
        </div>
        <div className="relative max-w-lg">
          <p className="text-3xl leading-tight font-semibold">
            Satu sumber kebenaran untuk transaksi, persetujuan, dan laporan
            keuangan.
          </p>
          <p className="mt-5 text-base leading-7 text-white/65">
            Dasol menjaga pemisahan perusahaan, jejak audit, periode akuntansi,
            dan jurnal berpasangan sejak fondasi sistem.
          </p>
        </div>
        <p className="relative text-xs text-white/40">
          Dasol menggunakan fondasi visual TailAdmin berlisensi MIT.
        </p>
      </aside>
    </main>
  );
}
