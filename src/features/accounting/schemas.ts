import { z } from "zod";

export const journalFormSchema = z
  .object({
    branchId: z
      .union([z.literal(""), z.uuid()])
      .transform((value) => value || null),
    description: z
      .string()
      .trim()
      .min(3, "Keterangan minimal tiga karakter.")
      .max(500),
    lines: z
      .string()
      .transform((value, context) => {
        try {
          return JSON.parse(value) as unknown;
        } catch {
          context.addIssue({
            code: "custom",
            message: "Baris jurnal tidak valid.",
          });
          return z.NEVER;
        }
      })
      .pipe(
        z
          .array(
            z.object({
              accountId: z.uuid("Akun wajib dipilih."),
              credit: z.coerce.number().min(0),
              debit: z.coerce.number().min(0),
              description: z.string().trim().max(500),
            }),
          )
          .min(2, "Minimal dua baris jurnal."),
      ),
    postingDate: z.iso.date(),
  })
  .superRefine((value, context) => {
    const debit = value.lines.reduce((sum, line) => sum + line.debit, 0);
    const credit = value.lines.reduce((sum, line) => sum + line.credit, 0);
    if (debit <= 0 || Math.abs(debit - credit) > 0.0001)
      context.addIssue({
        code: "custom",
        message: "Total debit dan kredit harus sama dan lebih besar dari nol.",
        path: ["lines"],
      });
    value.lines.forEach((line, index) => {
      if (line.debit > 0 === line.credit > 0)
        context.addIssue({
          code: "custom",
          message: "Setiap baris hanya boleh berisi debit atau kredit.",
          path: ["lines", index],
        });
    });
  });
export const journalReversalSchema = z.object({
  id: z.uuid(),
  reason: z.string().trim().min(5, "Alasan minimal lima karakter.").max(1000),
  reversalDate: z.iso.date(),
});
export const periodCommandSchema = z.object({
  id: z.uuid(),
  reason: z.string().trim().max(1000).optional().default(""),
});
