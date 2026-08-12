import Link from "next/link";
import type { Metadata } from "next";

import { EntityDetails } from "@/components/common/EntityDetails";
import { EntityPage } from "@/components/common/EntityPage";
import { StatusBadge } from "@/components/common/ModulePage";
import { formatIDR } from "@/domain/money";
import { detailCardClass } from "@/features/master/page-ui";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import { getContactRecord } from "@/server/queries/master";

export const metadata: Metadata = { title: "Detail Kontak" };

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requireCompanyPermission("contact.read");
  const record = await getContactRecord(context.companyId, id);
  const address =
    record.contact_addresses.find(
      (item: { is_primary: boolean }) => item.is_primary,
    ) ?? record.contact_addresses[0];
  return (
    <EntityPage
      description="Profil pelanggan/pemasok, data fiskal, dan alamat terdaftar."
      primaryHref={
        context.permissions.includes("contact.write")
          ? `/master/contacts/${id}/edit`
          : undefined
      }
      primaryLabel="Edit kontak"
      title={`${record.code} — ${record.display_name}`}
    >
      <section className={detailCardClass}>
        <EntityDetails
          items={[
            { label: "Tipe", value: record.contact_type },
            { label: "Nama legal", value: record.legal_name },
            { label: "Email", value: record.email },
            { label: "Telepon", value: record.phone },
            { label: "NPWP", value: record.tax_id },
            { label: "NITKU", value: record.tax_branch_id },
            {
              label: "PKP",
              value: record.is_taxable_entrepreneur ? "Ya" : "Tidak",
            },
            { label: "Batas kredit", value: formatIDR(record.credit_limit) },
            {
              label: "Alamat",
              value: address
                ? [
                    address.address_line,
                    address.city,
                    address.province,
                    address.postal_code,
                  ]
                    .filter(Boolean)
                    .join(", ")
                : "—",
            },
            {
              label: "Status",
              value: (
                <StatusBadge value={record.is_active ? "active" : "inactive"} />
              ),
            },
          ]}
        />
      </section>
      <Link
        className="text-brand-600 mt-4 inline-block text-sm font-semibold"
        href="/master/contacts"
      >
        ← Kembali ke daftar
      </Link>
    </EntityPage>
  );
}
