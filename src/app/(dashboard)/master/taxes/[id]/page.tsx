import Link from "next/link";
import type { Metadata } from "next";

import { EntityDetails } from "@/components/common/EntityDetails";
import { EntityPage, FormCard } from "@/components/common/EntityPage";
import { StatusBadge } from "@/components/common/ModulePage";
import {
  MutationForm,
  type MutationField,
} from "@/components/forms/MutationForm";
import { addTaxRateAction } from "@/features/master/actions";
import { detailCardClass } from "@/features/master/page-ui";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import { getTaxCodeRecord } from "@/server/queries/master";

export const metadata: Metadata = { title: "Detail Pajak" };

export default async function TaxDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ rateAdded?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const context = await requireCompanyPermission(
    "settings.manage",
    "report.tax.read",
  );
  const record = await getTaxCodeRecord(context.companyId, id);
  const rateFields: MutationField[] = [
    {
      label: "Tarif (%)",
      name: "rate",
      required: true,
      step: "0.000001",
      type: "number",
    },
    {
      label: "Berlaku mulai",
      name: "effectiveFrom",
      required: true,
      type: "date",
    },
    { label: "Berlaku sampai", name: "effectiveTo", type: "date" },
    {
      defaultValue: "half_up",
      label: "Pembulatan",
      name: "roundingMethod",
      options: [
        { label: "Terdekat", value: "half_up" },
        { label: "Ke atas", value: "up" },
        { label: "Ke bawah", value: "down" },
      ],
      required: true,
      type: "select",
    },
    {
      label: "Harga termasuk pajak",
      name: "priceIncludesTax",
      type: "checkbox",
    },
    { label: "Referensi aturan", name: "sourceReference" },
    { label: "Catatan", name: "notes", type: "textarea" },
  ];
  return (
    <EntityPage
      description="Identitas, pemetaan akun, dan seluruh versi tarif efektif."
      primaryHref={
        context.permissions.includes("settings.manage")
          ? `/master/taxes/${id}/edit`
          : undefined
      }
      primaryLabel="Edit kode pajak"
      title={`${record.code} — ${record.name}`}
    >
      {query.rateAdded === "1" ? (
        <p
          className="border-success-200 bg-success-50 text-success-700 mb-4 rounded-xl border px-4 py-3 text-sm"
          role="status"
        >
          Versi tarif berhasil ditambahkan.
        </p>
      ) : null}
      <section className={detailCardClass}>
        <EntityDetails
          items={[
            { label: "Kategori", value: record.category },
            {
              label: "Status",
              value: (
                <StatusBadge value={record.is_active ? "active" : "inactive"} />
              ),
            },
          ]}
        />
      </section>
      <section className={`${detailCardClass} mt-4`}>
        <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">
          Riwayat Tarif
        </h2>
        {record.tax_rate_versions.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2">Tarif</th>
                  <th>Mulai</th>
                  <th>Sampai</th>
                  <th>Status</th>
                  <th>Referensi</th>
                </tr>
              </thead>
              <tbody>
                {record.tax_rate_versions.map(
                  (rate: {
                    effective_from: string;
                    effective_to: string | null;
                    id: string;
                    rate: number;
                    source_reference: string | null;
                    status: string;
                  }) => (
                    <tr
                      className="border-b border-gray-100 dark:border-gray-800"
                      key={rate.id}
                    >
                      <td className="py-3">{rate.rate}%</td>
                      <td>{rate.effective_from}</td>
                      <td>{rate.effective_to ?? "—"}</td>
                      <td>
                        <StatusBadge value={rate.status} />
                      </td>
                      <td>{rate.source_reference ?? "—"}</td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Belum ada tarif.</p>
        )}
      </section>
      {context.permissions.includes("settings.manage") ? (
        <div className="mt-4">
          <FormCard>
            <h2 className="mb-5 font-semibold text-gray-900 dark:text-white">
              Tambah Versi Tarif
            </h2>
            <MutationForm
              action={addTaxRateAction}
              cancelHref="/master/taxes"
              fields={rateFields}
              hidden={{ taxCodeId: id }}
              submitLabel="Tambah tarif"
            />
          </FormCard>
        </div>
      ) : null}
      <Link
        className="text-brand-600 mt-4 inline-block text-sm font-semibold"
        href="/master/taxes"
      >
        ← Kembali ke daftar
      </Link>
    </EntityPage>
  );
}
