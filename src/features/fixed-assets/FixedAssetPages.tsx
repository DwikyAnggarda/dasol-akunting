import Link from "next/link";
import { redirect } from "next/navigation";

import { EntityDetails } from "@/components/common/EntityDetails";
import { EntityPage, FormCard } from "@/components/common/EntityPage";
import { ModulePage, StatusBadge } from "@/components/common/ModulePage";
import { ConfirmActionForm } from "@/components/forms/ConfirmActionForm";
import {
  MutationForm,
  type MutationField,
} from "@/components/forms/MutationForm";
import { formatIDR } from "@/domain/money";
import { detailCardClass } from "@/features/master/page-ui";
import { requireCompanyPermission } from "@/server/auth/require-permission";
import {
  getFixedAsset,
  getFixedAssetCategories,
  getFixedAssetOptions,
  getFixedAssets,
} from "@/server/queries/fixed-assets";

import {
  activateFixedAssetAction,
  deleteFixedAssetAction,
  disposeFixedAssetAction,
  postDepreciationAction,
  saveAssetCategoryAction,
  saveFixedAssetAction,
  toggleAssetCategoryAction,
} from "./actions";

const accountOptions = (
  accounts: { code: string; id: string; name: string }[],
) =>
  accounts.map((account) => ({
    label: `${account.code} — ${account.name}`,
    value: account.id,
  }));

type DepreciationEntry = {
  amount: number | string;
  id: string;
  journal_entries: { journal_number: string } | null;
  journal_entry_id: string | null;
  period_date: string;
  status: string;
};

export async function FixedAssetListPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  const params = await searchParams;
  const context = await requireCompanyPermission("fixed_asset.read");
  const rows = await getFixedAssets(context.companyId);
  return (
    <ModulePage
      actions={
        <div className="flex gap-2">
          <Link
            className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold"
            href="/fixed-assets/categories"
          >
            Kategori
          </Link>
          {context.permissions.includes("fixed_asset.write") ? (
            <Link
              className="bg-brand-500 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
              href="/fixed-assets/new"
            >
              Tambah aset
            </Link>
          ) : null}
        </div>
      }
      columns={[
        {
          key: "asset_code",
          label: "Kode",
          render: (value, row) => (
            <Link
              className="text-brand-600 font-semibold"
              href={`/fixed-assets/${row.id}`}
            >
              {String(value)}
            </Link>
          ),
        },
        { key: "name", label: "Nama" },
        {
          key: "fixed_asset_categories",
          label: "Kategori",
          render: (value) =>
            Array.isArray(value)
              ? String(value[0]?.name ?? "—")
              : String((value as { name: string }).name),
        },
        { key: "acquisition_date", label: "Akuisisi" },
        {
          align: "right",
          key: "acquisition_cost",
          label: "Biaya",
          render: (value) => formatIDR(String(value)),
        },
        {
          align: "right",
          key: "accumulated_depreciation",
          label: "Akumulasi",
          render: (value) => formatIDR(String(value)),
        },
        {
          key: "status",
          label: "Status",
          render: (value) => <StatusBadge value={String(value)} />,
        },
      ]}
      description="Register aset, jadwal straight-line, posting penyusutan, dan disposal dengan jurnal yang dapat ditelusuri."
      emptyAction={
        context.permissions.includes("fixed_asset.write") ? (
          <Link
            className="text-brand-600 text-sm font-semibold"
            href="/fixed-assets/new"
          >
            Tambah aset pertama
          </Link>
        ) : undefined
      }
      emptyDescription="Buat kategori dan draft aset sebelum aktivasi."
      emptyTitle="Belum ada aset tetap"
      rows={rows}
      successMessage={
        params.deleted ? "Draft aset berhasil dihapus." : undefined
      }
      title="Aset Tetap"
    />
  );
}

export async function FixedAssetFormPage({ id }: { id?: string }) {
  const context = await requireCompanyPermission("fixed_asset.write");
  const [options, record] = await Promise.all([
    getFixedAssetOptions(context.companyId),
    id ? getFixedAsset(context.companyId, id) : Promise.resolve(null),
  ]);
  if (record && record.status !== "draft") redirect(`/fixed-assets/${id}`);
  const categoryOptions = options.categories.map((category) => ({
    label: `${category.code} — ${category.name}`,
    value: category.id,
  }));
  const fields: MutationField[] = [
    {
      defaultValue: record?.asset_code,
      label: "Kode aset",
      name: "assetCode",
      required: true,
    },
    {
      defaultValue: record?.name,
      label: "Nama aset",
      name: "name",
      required: true,
    },
    {
      defaultValue: record?.category_id,
      label: "Kategori",
      name: "categoryId",
      options: categoryOptions,
      required: true,
      type: "select",
    },
    {
      defaultValue:
        record?.acquisition_date ?? new Date().toISOString().slice(0, 10),
      label: "Tanggal akuisisi",
      name: "acquisitionDate",
      required: true,
      type: "date",
    },
    {
      defaultValue:
        record?.in_service_date ?? new Date().toISOString().slice(0, 10),
      label: "Tanggal in-service",
      name: "inServiceDate",
      required: true,
      type: "date",
    },
    {
      defaultValue: record?.acquisition_cost ?? 0,
      label: "Biaya perolehan",
      name: "acquisitionCost",
      required: true,
      step: "0.01",
      type: "number",
    },
    {
      defaultValue: record?.residual_value ?? 0,
      label: "Nilai residu",
      name: "residualValue",
      required: true,
      step: "0.01",
      type: "number",
    },
    {
      defaultValue:
        record?.useful_life_months ??
        options.categories[0]?.default_useful_life_months ??
        48,
      label: "Masa manfaat (bulan)",
      name: "usefulLife",
      required: true,
      type: "number",
    },
  ];
  return (
    <EntityPage
      description="Draft dapat diedit. Aktivasi akan mengunci nilai dasar dan menghasilkan jadwal penyusutan."
      title={`${id ? "Edit" : "Tambah"} Aset Tetap`}
    >
      <FormCard>
        <MutationForm
          action={saveFixedAssetAction}
          cancelHref={id ? `/fixed-assets/${id}` : "/fixed-assets"}
          fields={fields}
          hidden={{
            id: record?.id ?? "",
            version: record ? String(record.version) : "",
          }}
          submitLabel="Simpan draft"
        />
      </FormCard>
    </EntityPage>
  );
}

export async function FixedAssetDetailPage({
  id,
  searchParams,
}: {
  id: string;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const query = await searchParams;
  const context = await requireCompanyPermission("fixed_asset.read");
  const record = await getFixedAsset(context.companyId, id);
  const options = await getFixedAssetOptions(context.companyId);
  const message = query.saved
    ? "Draft aset berhasil disimpan."
    : query.activated
      ? "Aset aktif dan jadwal penyusutan berhasil dibuat."
      : query.depreciated !== undefined
        ? `${query.depreciated} periode penyusutan berhasil diposting.`
        : query.disposed
          ? "Disposal aset berhasil diposting."
          : undefined;
  const bookValue =
    Number(record.acquisition_cost) - Number(record.accumulated_depreciation);
  return (
    <EntityPage
      description="Register, book value, jadwal penyusutan, dan jurnal disposal dalam satu detail."
      title={`${record.asset_code} · ${record.name}`}
    >
      {message ? (
        <p
          className="bg-success-50 text-success-700 mb-4 rounded-xl p-3 text-sm"
          role="status"
        >
          {message}
        </p>
      ) : null}
      <section className={detailCardClass}>
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <EntityDetails
            items={[
              { label: "Kategori", value: record.fixed_asset_categories?.name },
              { label: "Status", value: <StatusBadge value={record.status} /> },
              { label: "Akuisisi", value: record.acquisition_date },
              { label: "In service", value: record.in_service_date },
              {
                label: "Biaya perolehan",
                value: formatIDR(String(record.acquisition_cost)),
              },
              {
                label: "Nilai residu",
                value: formatIDR(String(record.residual_value)),
              },
              {
                label: "Akumulasi penyusutan",
                value: formatIDR(String(record.accumulated_depreciation)),
              },
              { label: "Nilai buku", value: formatIDR(String(bookValue)) },
              {
                label: "Masa manfaat",
                value: `${record.useful_life_months} bulan`,
              },
              { label: "Metode", value: "Straight line" },
            ]}
          />
          <div className="flex gap-2">
            {record.status === "draft" &&
            context.permissions.includes("fixed_asset.write") ? (
              <>
                <Link
                  className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold"
                  href={`/fixed-assets/${id}/edit`}
                >
                  Edit
                </Link>
                <ConfirmActionForm
                  action={deleteFixedAssetAction}
                  confirmMessage="Hapus draft aset ini?"
                  fields={{ id, version: String(record.version) }}
                  label="Hapus draft"
                  tone="danger"
                />
              </>
            ) : null}
            {record.status === "draft" &&
            context.permissions.includes("fixed_asset.post") ? (
              <ConfirmActionForm
                action={activateFixedAssetAction}
                confirmMessage="Aktifkan aset dan buat jadwal penyusutan? Data dasar tidak dapat diedit setelah aktivasi."
                fields={{ id }}
                label="Aktifkan"
                tone="primary"
              />
            ) : null}
          </div>
        </div>
        {record.disposalJournal ? (
          <p className="rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800">
            Jurnal disposal:{" "}
            <Link
              className="text-brand-600 font-semibold"
              href={`/accounting/journals/${record.disposalJournal.id}`}
            >
              {record.disposalJournal.journal_number}
            </Link>
          </p>
        ) : null}
      </section>
      {record.status === "active" &&
      context.permissions.includes("fixed_asset.post") ? (
        <section className={`${detailCardClass} mt-4`}>
          <h2 className="mb-4 font-semibold">Run Depreciation</h2>
          <MutationForm
            action={postDepreciationAction}
            cancelHref={`/fixed-assets/${id}`}
            fields={[
              {
                defaultValue: new Date().toISOString().slice(0, 10),
                label: "Posting sampai tanggal",
                name: "throughDate",
                required: true,
                type: "date",
              },
            ]}
            hidden={{ id }}
            submitLabel="Posting penyusutan jatuh tempo"
          />
        </section>
      ) : null}
      {record.schedule.length ? (
        <section className={`${detailCardClass} mt-4 overflow-x-auto`}>
          <h2 className="mb-4 font-semibold">Jadwal Penyusutan</h2>
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-gray-500 uppercase">
                <th className="py-3">Periode</th>
                <th className="text-right">Jumlah</th>
                <th>Status</th>
                <th>Jurnal</th>
              </tr>
            </thead>
            <tbody>
              {record.schedule.map((entry: DepreciationEntry) => (
                <tr
                  className="border-b border-gray-100 dark:border-gray-800"
                  key={entry.id}
                >
                  <td className="py-3">{entry.period_date}</td>
                  <td className="text-right">
                    {formatIDR(String(entry.amount))}
                  </td>
                  <td>
                    <StatusBadge value={entry.status} />
                  </td>
                  <td>
                    {entry.journal_entry_id ? (
                      <Link
                        className="text-brand-600 font-semibold"
                        href={`/accounting/journals/${entry.journal_entry_id}`}
                      >
                        {entry.journal_entries?.journal_number ??
                          "Lihat jurnal"}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
      {record.status === "active" &&
      context.permissions.includes("fixed_asset.dispose") ? (
        <section className={`${detailCardClass} mt-4`}>
          <h2 className="mb-4 font-semibold">Dispose / Write Off</h2>
          <MutationForm
            action={disposeFixedAssetAction}
            cancelHref={`/fixed-assets/${id}`}
            fields={[
              {
                defaultValue: new Date().toISOString().slice(0, 10),
                label: "Tanggal disposal",
                name: "disposalDate",
                required: true,
                type: "date",
              },
              {
                defaultValue: 0,
                label: "Hasil disposal (0 untuk write-off)",
                name: "proceeds",
                required: true,
                step: "0.01",
                type: "number",
              },
              {
                label: "Akun penerimaan",
                name: "proceedsAccountId",
                options: accountOptions(options.accounts),
                type: "select",
              },
              {
                label: "Akun laba/rugi disposal",
                name: "gainLossAccountId",
                options: accountOptions(options.accounts),
                required: true,
                type: "select",
              },
              {
                label: "Alasan disposal",
                name: "reason",
                required: true,
                type: "textarea",
              },
            ]}
            hidden={{ id }}
            submitLabel="Posting disposal"
          />
        </section>
      ) : null}
      <Link
        className="text-brand-600 mt-4 inline-block text-sm font-semibold"
        href="/fixed-assets"
      >
        ← Kembali ke daftar
      </Link>
    </EntityPage>
  );
}

export async function CategoryListPage() {
  const context = await requireCompanyPermission(
    "fixed_asset.read",
    "fixed_asset.write",
  );
  const rows = await getFixedAssetCategories(context.companyId);
  const canWrite = context.permissions.includes("fixed_asset.write");
  return (
    <ModulePage
      actions={
        canWrite ? (
          <Link
            className="bg-brand-500 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
            href="/fixed-assets/categories/new"
          >
            Tambah kategori
          </Link>
        ) : undefined
      }
      columns={[
        { key: "code", label: "Kode" },
        { key: "name", label: "Nama" },
        {
          key: "default_useful_life_months",
          label: "Masa manfaat",
          render: (value) => `${String(value)} bulan`,
        },
        {
          key: "is_active",
          label: "Status",
          render: (value) => (
            <StatusBadge value={value ? "active" : "inactive"} />
          ),
        },
        {
          align: "right",
          key: "id",
          label: "Aksi",
          render: (_value, row) => (
            <div className="flex justify-end gap-2">
              {canWrite ? (
                <>
                  <Link
                    className="text-brand-600 text-xs font-semibold"
                    href={`/fixed-assets/categories/${row.id}/edit`}
                  >
                    Edit
                  </Link>
                  <ConfirmActionForm
                    action={toggleAssetCategoryAction}
                    confirmMessage={`${row.is_active ? "Nonaktifkan" : "Aktifkan"} kategori ini?`}
                    fields={{
                      activate: String(!row.is_active),
                      id: row.id,
                      version: String(row.version),
                    }}
                    label={row.is_active ? "Nonaktifkan" : "Aktifkan"}
                    tone={row.is_active ? "danger" : "primary"}
                  />
                </>
              ) : null}
            </div>
          ),
        },
      ]}
      description="Kategori menentukan akun aset, akumulasi penyusutan, beban, dan masa manfaat default."
      emptyDescription="Kategori wajib tersedia sebelum membuat aset."
      emptyTitle="Belum ada kategori"
      rows={rows}
      title="Kategori Aset Tetap"
    />
  );
}

export async function CategoryFormPage({ id }: { id?: string }) {
  const context = await requireCompanyPermission("fixed_asset.write");
  const [options, categories] = await Promise.all([
    getFixedAssetOptions(context.companyId),
    getFixedAssetCategories(context.companyId),
  ]);
  const record = id ? categories.find((item) => item.id === id) : undefined;
  if (id && !record) throw new Error("Kategori aset tidak ditemukan.");
  const fields: MutationField[] = [
    { defaultValue: record?.code, label: "Kode", name: "code", required: true },
    { defaultValue: record?.name, label: "Nama", name: "name", required: true },
    {
      defaultValue: record?.asset_account_id,
      label: "Akun aset",
      name: "assetAccountId",
      options: accountOptions(options.accounts),
      required: true,
      type: "select",
    },
    {
      defaultValue: record?.accumulated_depreciation_account_id,
      label: "Akun akumulasi penyusutan",
      name: "accumulatedAccountId",
      options: accountOptions(options.accounts),
      required: true,
      type: "select",
    },
    {
      defaultValue: record?.depreciation_expense_account_id,
      label: "Akun beban penyusutan",
      name: "expenseAccountId",
      options: accountOptions(options.accounts),
      required: true,
      type: "select",
    },
    {
      defaultValue: record?.default_useful_life_months ?? 48,
      label: "Masa manfaat default (bulan)",
      name: "usefulLife",
      required: true,
      type: "number",
    },
  ];
  return (
    <EntityPage
      description="Pemetaan kategori dipakai langsung oleh posting engine penyusutan."
      title={`${id ? "Edit" : "Tambah"} Kategori Aset`}
    >
      <FormCard>
        <MutationForm
          action={saveAssetCategoryAction}
          cancelHref="/fixed-assets/categories"
          fields={fields}
          hidden={{
            id: record?.id ?? "",
            version: record ? String(record.version) : "",
          }}
        />
      </FormCard>
    </EntityPage>
  );
}
