import type { MutationField } from "@/components/forms/MutationForm";

type Option = { label: string; value: string };
type MasterOptions = {
  accounts: (Option & { type: string })[];
  branches: Option[];
  paymentTerms: Option[];
  taxes: Option[];
  units: Option[];
};

const accountTypes = [
  ["asset", "Aset"],
  ["liability", "Liabilitas"],
  ["equity", "Ekuitas"],
  ["revenue", "Pendapatan"],
  ["cost_of_goods_sold", "Harga Pokok Penjualan"],
  ["expense", "Beban"],
  ["other_income", "Pendapatan Lain"],
  ["other_expense", "Beban Lain"],
].map(([value, label]) => ({ label, value }));

export function accountFields(
  accounts: Option[],
  record?: Record<string, unknown>,
): MutationField[] {
  return [
    {
      defaultValue: record?.code as string,
      label: "Kode akun",
      name: "code",
      required: true,
    },
    {
      defaultValue: record?.name as string,
      label: "Nama akun",
      name: "name",
      required: true,
    },
    {
      defaultValue: record?.account_type as string,
      label: "Tipe akun",
      name: "accountType",
      options: accountTypes,
      required: true,
      type: "select",
    },
    {
      defaultValue: record?.normal_balance as string,
      label: "Saldo normal",
      name: "normalBalance",
      options: [
        { label: "Debit", value: "debit" },
        { label: "Kredit", value: "credit" },
      ],
      required: true,
      type: "select",
    },
    {
      defaultValue: record?.parent_id as string,
      label: "Akun induk",
      name: "parentId",
      options: accounts,
      type: "select",
    },
    {
      defaultValue: record?.cash_flow_category as string,
      label: "Kategori arus kas",
      name: "cashFlowCategory",
      options: [
        { label: "Operasi", value: "operating" },
        { label: "Investasi", value: "investing" },
        { label: "Pendanaan", value: "financing" },
      ],
      type: "select",
    },
    {
      defaultValue: record ? Boolean(record.is_control_account) : false,
      label: "Akun kontrol",
      name: "isControlAccount",
      type: "checkbox",
    },
    {
      defaultValue: record ? Boolean(record.allow_manual_entry) : true,
      label: "Izinkan jurnal manual",
      name: "allowManualEntry",
      type: "checkbox",
    },
  ];
}

export function contactFields(
  options: MasterOptions,
  record?: Record<string, unknown>,
): MutationField[] {
  const addresses =
    (record?.contact_addresses as Record<string, unknown>[] | undefined) ?? [];
  const address =
    addresses.find((item) => item.is_primary) ?? addresses[0] ?? {};
  return [
    {
      defaultValue: record?.code as string,
      label: "Kode kontak",
      name: "code",
      required: true,
    },
    {
      defaultValue: record?.contact_type as string,
      label: "Tipe kontak",
      name: "contactType",
      options: [
        { label: "Pelanggan", value: "customer" },
        { label: "Pemasok", value: "supplier" },
        { label: "Pelanggan & pemasok", value: "both" },
      ],
      required: true,
      type: "select",
    },
    {
      defaultValue: record?.display_name as string,
      label: "Nama tampilan",
      name: "displayName",
      required: true,
    },
    {
      defaultValue: record?.legal_name as string,
      label: "Nama legal",
      name: "legalName",
    },
    {
      autoComplete: "email",
      defaultValue: record?.email as string,
      label: "Email",
      name: "email",
      type: "email",
    },
    {
      autoComplete: "tel",
      defaultValue: record?.phone as string,
      label: "Telepon",
      name: "phone",
    },
    { defaultValue: record?.tax_id as string, label: "NPWP", name: "taxId" },
    {
      defaultValue: record?.national_id as string,
      label: "NIK",
      name: "nationalId",
    },
    {
      defaultValue: record?.tax_branch_id as string,
      label: "NITKU",
      name: "taxBranchId",
    },
    {
      defaultValue: record ? Boolean(record.is_taxable_entrepreneur) : false,
      label: "Pengusaha Kena Pajak (PKP)",
      name: "isTaxableEntrepreneur",
      type: "checkbox",
    },
    {
      defaultValue: record?.payment_term_id as string,
      label: "Termin pembayaran",
      name: "paymentTermId",
      options: options.paymentTerms,
      type: "select",
    },
    {
      defaultValue: (record?.credit_limit as string) ?? 0,
      label: "Batas kredit",
      name: "creditLimit",
      step: "0.01",
      type: "number",
    },
    {
      defaultValue: record?.receivable_account_id as string,
      label: "Akun piutang",
      name: "receivableAccountId",
      options: options.accounts.filter((item) => item.type === "asset"),
      type: "select",
    },
    {
      defaultValue: record?.payable_account_id as string,
      label: "Akun utang",
      name: "payableAccountId",
      options: options.accounts.filter((item) => item.type === "liability"),
      type: "select",
    },
    {
      defaultValue: record?.default_tax_code_id as string,
      label: "Pajak default",
      name: "defaultTaxCodeId",
      options: options.taxes,
      type: "select",
    },
    {
      defaultValue: address.address_line as string,
      label: "Alamat",
      name: "addressLine",
      type: "textarea",
    },
    { defaultValue: address.city as string, label: "Kota", name: "city" },
    {
      defaultValue: address.province as string,
      label: "Provinsi",
      name: "province",
    },
    {
      defaultValue: address.postal_code as string,
      label: "Kode pos",
      name: "postalCode",
    },
    {
      defaultValue: record?.notes as string,
      label: "Catatan",
      name: "notes",
      type: "textarea",
    },
  ];
}

export function productFields(
  options: MasterOptions,
  record?: Record<string, unknown>,
): MutationField[] {
  return [
    {
      defaultValue: record?.sku as string,
      label: "SKU",
      name: "sku",
      required: true,
    },
    {
      defaultValue: record?.barcode as string,
      label: "Barcode",
      name: "barcode",
    },
    {
      defaultValue: record?.name as string,
      label: "Nama produk",
      name: "name",
      required: true,
    },
    {
      defaultValue: record?.product_type as string,
      label: "Tipe produk",
      name: "productType",
      options: [
        { label: "Persediaan", value: "inventory" },
        { label: "Non-persediaan", value: "non_inventory" },
        { label: "Jasa", value: "service" },
      ],
      required: true,
      type: "select",
    },
    {
      defaultValue: record?.base_unit_id as string,
      label: "Satuan dasar",
      name: "baseUnitId",
      options: options.units,
      required: true,
      type: "select",
    },
    {
      defaultValue: (record?.sales_price as string) ?? 0,
      label: "Harga jual",
      name: "salesPrice",
      step: "0.01",
      type: "number",
    },
    {
      defaultValue: (record?.purchase_price as string) ?? 0,
      label: "Harga beli",
      name: "purchasePrice",
      step: "0.01",
      type: "number",
    },
    {
      defaultValue: (record?.minimum_stock as string) ?? 0,
      label: "Stok minimum",
      name: "minimumStock",
      step: "0.000001",
      type: "number",
    },
    {
      defaultValue: record?.sales_account_id as string,
      label: "Akun penjualan",
      name: "salesAccountId",
      options: options.accounts,
      required: true,
      type: "select",
    },
    {
      defaultValue: record?.purchase_account_id as string,
      label: "Akun pembelian/beban",
      name: "purchaseAccountId",
      options: options.accounts,
      required: true,
      type: "select",
    },
    {
      defaultValue: record?.inventory_account_id as string,
      label: "Akun persediaan",
      name: "inventoryAccountId",
      options: options.accounts,
      type: "select",
    },
    {
      defaultValue: record?.cogs_account_id as string,
      label: "Akun HPP",
      name: "cogsAccountId",
      options: options.accounts,
      type: "select",
    },
    {
      defaultValue: record?.default_sales_tax_code_id as string,
      label: "Pajak penjualan",
      name: "defaultSalesTaxCodeId",
      options: options.taxes,
      type: "select",
    },
    {
      defaultValue: record?.default_purchase_tax_code_id as string,
      label: "Pajak pembelian",
      name: "defaultPurchaseTaxCodeId",
      options: options.taxes,
      type: "select",
    },
  ];
}

export function warehouseFields(
  branches: Option[],
  record?: Record<string, unknown>,
): MutationField[] {
  return [
    {
      defaultValue: record?.code as string,
      label: "Kode gudang",
      name: "code",
      required: true,
    },
    {
      defaultValue: record?.name as string,
      label: "Nama gudang",
      name: "name",
      required: true,
    },
    {
      defaultValue: record?.branch_id as string,
      label: "Cabang",
      name: "branchId",
      options: branches,
      required: true,
      type: "select",
    },
    {
      defaultValue: record?.address_line as string,
      label: "Alamat",
      name: "addressLine",
      type: "textarea",
    },
    { defaultValue: record?.city as string, label: "Kota", name: "city" },
    {
      defaultValue: record?.province as string,
      label: "Provinsi",
      name: "province",
    },
    {
      defaultValue: record?.postal_code as string,
      label: "Kode pos",
      name: "postalCode",
    },
  ];
}

export function taxCodeFields(
  accounts: Option[],
  record?: Record<string, unknown>,
): MutationField[] {
  return [
    {
      defaultValue: record?.code as string,
      label: "Kode pajak",
      name: "code",
      required: true,
    },
    {
      defaultValue: record?.name as string,
      label: "Nama pajak",
      name: "name",
      required: true,
    },
    {
      defaultValue: record?.category as string,
      label: "Kategori",
      name: "category",
      options: [
        { label: "PPN Masukan", value: "vat_input" },
        { label: "PPN Keluaran", value: "vat_output" },
        { label: "Potongan diterima", value: "withholding_receivable" },
        { label: "Potongan terutang", value: "withholding_payable" },
        { label: "Pajak final", value: "final_withholding" },
        { label: "Tidak kena pajak", value: "non_taxable" },
        { label: "Dibebaskan", value: "exempt" },
        { label: "Lainnya", value: "other" },
      ],
      required: true,
      type: "select",
    },
    {
      defaultValue: record?.input_account_id as string,
      label: "Akun pajak masukan",
      name: "inputAccountId",
      options: accounts,
      type: "select",
    },
    {
      defaultValue: record?.output_account_id as string,
      label: "Akun pajak keluaran",
      name: "outputAccountId",
      options: accounts,
      type: "select",
    },
  ];
}

export function bankAccountFields(
  accounts: Option[],
  record?: Record<string, unknown>,
): MutationField[] {
  return [
    {
      defaultValue: record?.code as string,
      label: "Kode",
      name: "code",
      required: true,
    },
    {
      defaultValue: record?.name as string,
      label: "Nama akun",
      name: "name",
      required: true,
    },
    {
      defaultValue: record?.account_type as string,
      label: "Tipe",
      name: "accountType",
      options: [
        { label: "Bank", value: "bank" },
        { label: "Kas", value: "cash" },
      ],
      required: true,
      type: "select",
    },
    {
      defaultValue: record?.bank_name as string,
      label: "Nama bank",
      name: "bankName",
    },
    {
      defaultValue: record?.masked_account_number as string,
      description:
        "Simpan nomor yang sudah dimasking, bukan credential perbankan.",
      label: "Nomor rekening tersamarkan",
      name: "maskedAccountNumber",
      placeholder: "****1234",
    },
    {
      defaultValue: (record?.currency_code as string) ?? "IDR",
      label: "Mata uang",
      name: "currencyCode",
      required: true,
    },
    {
      defaultValue: record?.gl_account_id as string,
      label: "Akun GL",
      name: "glAccountId",
      options: accounts,
      required: true,
      type: "select",
    },
  ];
}
