import type { Metadata } from "next";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { getActiveCompanyContext } from "@/server/queries/company-context";
export const metadata: Metadata = { title: "Pengaturan Perusahaan" };
export default async function CompanySettingsPage() {
  const context = await getActiveCompanyContext();
  return (
    <div>
      <PageBreadCrumb pageTitle="Pengaturan" />
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Pengaturan perusahaan
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Identitas tenant dan konteks akses yang telah diverifikasi di server.
        </p>
      </div>
      <section className="shadow-theme-xs max-w-3xl rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <dl className="grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
              Nama perusahaan
            </dt>
            <dd className="mt-2 font-medium text-gray-900 dark:text-white">
              {context.companyName}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
              Kode
            </dt>
            <dd className="mt-2 font-medium text-gray-900 dark:text-white">
              {context.companyCode}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
              Role aktif
            </dt>
            <dd className="mt-2 font-medium text-gray-900 dark:text-white">
              {context.roleName}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
              Jumlah izin
            </dt>
            <dd className="mt-2 font-medium text-gray-900 dark:text-white">
              {context.permissions.length}
            </dd>
          </div>
        </dl>
        <p className="mt-6 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
          Perubahan konfigurasi akuntansi dilakukan melalui migration/RPC dan
          selalu divalidasi ulang oleh RLS. Halaman ini saat ini bersifat
          read-only agar tidak menawarkan mutasi konfigurasi yang belum diaudit.
        </p>
      </section>
    </div>
  );
}
