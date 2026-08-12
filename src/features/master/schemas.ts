import { z } from "zod";

const optionalUuid = z
  .union([z.literal(""), z.uuid("Pilihan tidak valid.")])
  .transform((value) => value || null);
const optionalText = z
  .string()
  .trim()
  .transform((value) => value || null);
const code = z
  .string()
  .trim()
  .min(2, "Kode minimal 2 karakter.")
  .max(30, "Kode maksimal 30 karakter.")
  .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, "Format kode tidak valid.")
  .transform((value) => value.toUpperCase());
const idAndVersion = {
  id: optionalUuid.default(""),
  version: z.coerce.number().int().positive().nullable().default(null),
};

export const accountFormSchema = z.object({
  ...idAndVersion,
  accountType: z.enum([
    "asset",
    "liability",
    "equity",
    "revenue",
    "cost_of_goods_sold",
    "expense",
    "other_income",
    "other_expense",
  ]),
  allowManualEntry: z.string().optional().transform(Boolean),
  cashFlowCategory: z
    .union([z.literal(""), z.enum(["operating", "investing", "financing"])])
    .transform((value) => value || null),
  code,
  isControlAccount: z.string().optional().transform(Boolean),
  name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(160),
  normalBalance: z.enum(["debit", "credit"]),
  parentId: optionalUuid,
});

export const contactFormSchema = z.object({
  ...idAndVersion,
  addressLine: optionalText,
  city: optionalText,
  code,
  contactType: z.enum(["customer", "supplier", "both"]),
  creditLimit: z.coerce.number().min(0, "Batas kredit tidak boleh negatif."),
  defaultTaxCodeId: optionalUuid,
  displayName: z
    .string()
    .trim()
    .min(2, "Nama tampilan minimal 2 karakter.")
    .max(160),
  email: z
    .union([z.literal(""), z.email("Email tidak valid.")])
    .transform((value) => value || null),
  isTaxableEntrepreneur: z.string().optional().transform(Boolean),
  legalName: optionalText,
  nationalId: optionalText,
  notes: optionalText,
  payableAccountId: optionalUuid,
  paymentTermId: optionalUuid,
  phone: optionalText,
  postalCode: optionalText,
  province: optionalText,
  receivableAccountId: optionalUuid,
  taxBranchId: optionalText,
  taxId: optionalText,
});

export const productFormSchema = z
  .object({
    ...idAndVersion,
    barcode: optionalText,
    baseUnitId: z.uuid("Satuan wajib dipilih."),
    cogsAccountId: optionalUuid,
    defaultPurchaseTaxCodeId: optionalUuid,
    defaultSalesTaxCodeId: optionalUuid,
    inventoryAccountId: optionalUuid,
    minimumStock: z.coerce.number().min(0),
    name: z.string().trim().min(2).max(160),
    productType: z.enum(["inventory", "non_inventory", "service"]),
    purchaseAccountId: z.uuid("Akun pembelian wajib dipilih."),
    purchasePrice: z.coerce.number().min(0),
    salesAccountId: z.uuid("Akun penjualan wajib dipilih."),
    salesPrice: z.coerce.number().min(0),
    sku: code,
  })
  .superRefine((value, context) => {
    if (
      value.productType === "inventory" &&
      (!value.inventoryAccountId || !value.cogsAccountId)
    ) {
      context.addIssue({
        code: "custom",
        message: "Produk persediaan memerlukan akun persediaan dan HPP.",
        path: ["inventoryAccountId"],
      });
    }
  });

export const warehouseFormSchema = z.object({
  ...idAndVersion,
  addressLine: optionalText,
  branchId: z.uuid("Cabang wajib dipilih."),
  city: optionalText,
  code,
  name: z.string().trim().min(2).max(160),
  postalCode: optionalText,
  province: optionalText,
});

export const taxCodeFormSchema = z.object({
  ...idAndVersion,
  category: z.enum([
    "vat_input",
    "vat_output",
    "withholding_receivable",
    "withholding_payable",
    "final_withholding",
    "non_taxable",
    "exempt",
    "other",
  ]),
  code,
  inputAccountId: optionalUuid,
  name: z.string().trim().min(2).max(160),
  outputAccountId: optionalUuid,
});

export const taxRateFormSchema = z.object({
  effectiveFrom: z.iso.date("Tanggal berlaku tidak valid."),
  effectiveTo: z
    .union([z.literal(""), z.iso.date()])
    .transform((value) => value || null),
  notes: optionalText,
  priceIncludesTax: z.string().optional().transform(Boolean),
  rate: z.coerce.number().min(0).max(100),
  roundingMethod: z.enum(["half_up", "up", "down"]),
  sourceReference: optionalText,
  taxCodeId: z.uuid(),
});

export const bankAccountFormSchema = z.object({
  ...idAndVersion,
  accountType: z.enum(["bank", "cash"]),
  bankName: optionalText,
  code,
  currencyCode: z
    .string()
    .length(3)
    .transform((value) => value.toUpperCase()),
  glAccountId: z.uuid("Akun GL wajib dipilih."),
  maskedAccountNumber: optionalText,
  name: z.string().trim().min(2).max(160),
});

export const archiveFormSchema = z.object({
  id: z.uuid(),
  version: z.coerce.number().int().positive(),
});
