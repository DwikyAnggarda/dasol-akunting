import type { Metadata } from "next";

import { selectCompanyAction } from "@/features/companies/actions";
import { getCompanyMemberships } from "@/server/queries/company-context";

export const metadata: Metadata = { title: "Pilih perusahaan" };

export default async function SelectCompanyPage() {
  const memberships = await getCompanyMemberships();

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12 dark:bg-gray-950">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center gap-3">
          <span className="bg-brand-500 grid size-11 place-items-center rounded-2xl text-xl font-bold text-white">
            D
          </span>
          <div>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">
              Pilih perusahaan
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Setiap data dan izin akan mengikuti perusahaan aktif.
            </p>
          </div>
        </div>

        {memberships.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Belum ada akses perusahaan
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Hubungi administrator untuk menambahkan keanggotaan aktif.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {memberships.map((membership) => (
              <form action={selectCompanyAction} key={membership.membershipId}>
                <input
                  name="companyId"
                  type="hidden"
                  value={membership.companyId}
                />
                <button
                  className="group shadow-theme-xs hover:border-brand-300 hover:shadow-theme-md dark:hover:border-brand-700 flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white p-6 text-left transition dark:border-gray-800 dark:bg-gray-900"
                  type="submit"
                >
                  <span>
                    <span className="text-brand-600 block text-xs font-semibold tracking-wider uppercase">
                      {membership.companyCode}
                    </span>
                    <span className="mt-2 block font-semibold text-gray-900 dark:text-white">
                      {membership.companyName}
                    </span>
                    <span className="mt-1 block text-sm text-gray-500 dark:text-gray-400">
                      {membership.roleName}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className="group-hover:text-brand-500 text-2xl text-gray-300 transition group-hover:translate-x-1"
                  >
                    →
                  </span>
                </button>
              </form>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
