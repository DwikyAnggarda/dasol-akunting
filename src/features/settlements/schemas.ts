import { z } from "zod";

const optionalUuid = z
  .union([z.literal(""), z.uuid()])
  .transform((value) => value || null);

export const settlementFormSchema = z.object({
  allocations: z
    .string()
    .transform((value, context) => {
      try {
        return JSON.parse(value) as unknown;
      } catch {
        context.addIssue({
          code: "custom",
          message: "Data alokasi tidak valid.",
        });
        return z.NEVER;
      }
    })
    .pipe(
      z
        .array(
          z.object({ amount: z.coerce.number().positive(), itemId: z.uuid() }),
        )
        .min(1, "Minimal satu alokasi wajib diisi."),
    ),
  bankAccountId: z.uuid("Akun bank/kas wajib dipilih."),
  branchId: z.uuid("Cabang wajib dipilih."),
  contactId: z.uuid("Kontak wajib dipilih."),
  id: optionalUuid,
  kind: z.enum(["customer", "supplier"]),
  notes: z
    .string()
    .trim()
    .max(2000)
    .transform((value) => value || null),
  settlementDate: z.iso.date(),
  version: z.coerce.number().int().positive().nullable(),
});

export const settlementCommandSchema = z.object({
  id: z.uuid(),
  kind: z.enum(["customer", "supplier"]),
  version: z.coerce.number().int().positive().optional(),
});
export const reversalSchema = settlementCommandSchema.extend({
  reason: z.string().trim().min(5, "Alasan minimal lima karakter.").max(1000),
  reversalDate: z.iso.date(),
});
