import { z } from "zod";

const optionalUuid = z
  .union([z.literal(""), z.uuid("Pilihan tidak valid.")])
  .transform((value) => value || null);

export const invoiceLineSchema = z.object({
  description: z
    .string()
    .trim()
    .min(2, "Deskripsi baris wajib diisi.")
    .max(500),
  discountAmount: z.coerce.number().min(0, "Diskon tidak boleh negatif."),
  productId: z.uuid("Produk wajib dipilih."),
  quantity: z.coerce.number().positive("Kuantitas harus lebih besar dari nol."),
  taxRateVersionId: optionalUuid,
  unitPrice: z.coerce.number().min(0, "Harga tidak boleh negatif."),
  warehouseId: optionalUuid,
});

export const invoiceFormSchema = z
  .object({
    branchId: z.uuid("Cabang wajib dipilih."),
    contactId: z.uuid("Kontak wajib dipilih."),
    currencyCode: z
      .string()
      .trim()
      .length(3)
      .transform((value) => value.toUpperCase()),
    documentDate: z.iso.date("Tanggal dokumen tidak valid."),
    dueDate: z.iso.date("Tanggal jatuh tempo tidak valid."),
    exchangeRate: z.coerce
      .number()
      .positive("Kurs harus lebih besar dari nol."),
    id: optionalUuid,
    kind: z.enum(["purchase", "sales"]),
    lines: z
      .string()
      .transform((value, context) => {
        try {
          return JSON.parse(value) as unknown;
        } catch {
          context.addIssue({
            code: "custom",
            message: "Data baris invoice tidak valid.",
          });
          return z.NEVER;
        }
      })
      .pipe(z.array(invoiceLineSchema).min(1, "Minimal satu baris invoice.")),
    notes: z
      .string()
      .trim()
      .max(2000)
      .transform((value) => value || null),
    postingDate: z.iso.date("Tanggal posting tidak valid."),
    supplierReference: z
      .string()
      .trim()
      .max(100)
      .transform((value) => value || null),
    version: z.coerce.number().int().positive().nullable(),
  })
  .refine((value) => value.dueDate >= value.documentDate, {
    message: "Jatuh tempo tidak boleh sebelum tanggal dokumen.",
    path: ["dueDate"],
  });

export const invoiceCommandSchema = z.object({
  id: z.uuid(),
  kind: z.enum(["purchase", "sales"]),
  version: z.coerce.number().int().positive().optional(),
});

export const approvalCommandSchema = z.object({
  comment: z.string().trim().max(1000).optional().default(""),
  documentId: z.uuid(),
  documentType: z.enum(["purchase_invoice", "sales_invoice"]),
  requestId: z.uuid(),
});

export const invoiceReversalSchema = invoiceCommandSchema.extend({
  reason: z.string().trim().min(5, "Alasan minimal lima karakter.").max(1000),
  reversalDate: z.iso.date(),
});
