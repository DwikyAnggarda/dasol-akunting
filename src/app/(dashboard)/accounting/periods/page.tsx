import type { Metadata } from "next";
import { ModulePage, StatusBadge } from "@/components/common/ModulePage";
import { ConfirmActionForm } from "@/components/forms/ConfirmActionForm";
import { WorkflowActionForm } from "@/components/forms/WorkflowActionForm";
import {
  closePeriodAction,
  reopenPeriodAction,
} from "@/features/accounting/actions";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import { getAccountingPeriods } from "@/server/queries/accounting";
export const metadata: Metadata = { title: "Periode Akuntansi" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ closed?: string; reopened?: string }>;
}) {
  const params = await searchParams;
  const context = await requireCompanyPermission("journal.read");
  const rows = await getAccountingPeriods(context.companyId);
  return (
    <ModulePage
      columns={[
        { key: "period_number", label: "Periode" },
        { key: "starts_on", label: "Mulai" },
        { key: "ends_on", label: "Selesai" },
        {
          key: "status",
          label: "Status",
          render: (value) => <StatusBadge value={String(value)} />,
        },
        {
          align: "right",
          key: "id",
          label: "Aksi",
          render: (_value, row) =>
            row.status === "open" &&
            context.permissions.includes("period.close") ? (
              <ConfirmActionForm
                action={closePeriodAction}
                confirmMessage="Tutup periode ini? Posting baru pada rentang ini akan ditolak."
                fields={{ id: row.id }}
                label="Tutup periode"
                tone="danger"
              />
            ) : row.status === "locked" &&
              context.permissions.includes("period.reopen") ? (
              <div className="min-w-64">
                <WorkflowActionForm
                  action={reopenPeriodAction}
                  confirmMessage="Buka kembali periode ini?"
                  fields={{ id: row.id }}
                  label="Buka kembali"
                  requireComment
                />
              </div>
            ) : null,
        },
      ]}
      description="Periode terkunci menolak posting. Pembukaan kembali memerlukan izin khusus dan alasan audit."
      emptyDescription="Periode dibuat bersama tahun fiskal perusahaan."
      emptyTitle="Belum ada periode"
      rows={rows}
      successMessage={
        params.closed === "1"
          ? "Periode berhasil ditutup."
          : params.reopened === "1"
            ? "Periode berhasil dibuka kembali."
            : undefined
      }
      title="Periode Akuntansi"
    />
  );
}
