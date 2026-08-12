import { z } from "zod";

const optionalUuid = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.uuid().optional(),
);
const optionalVersion = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.coerce.number().int().positive().optional(),
);

export const categorySchema = z.object({
  accumulatedAccountId: z.uuid(),
  assetAccountId: z.uuid(),
  code: z
    .string()
    .trim()
    .min(2)
    .max(30)
    .transform((value) => value.toUpperCase()),
  expenseAccountId: z.uuid(),
  id: optionalUuid,
  name: z.string().trim().min(2).max(100),
  usefulLife: z.coerce.number().int().positive().max(1200),
  version: optionalVersion,
});

export const assetSchema = z
  .object({
    acquisitionCost: z.coerce.number().positive(),
    acquisitionDate: z.iso.date(),
    assetCode: z
      .string()
      .trim()
      .min(2)
      .max(40)
      .transform((value) => value.toUpperCase()),
    categoryId: z.uuid(),
    id: optionalUuid,
    inServiceDate: z.iso.date(),
    name: z.string().trim().min(2).max(120),
    residualValue: z.coerce.number().nonnegative(),
    usefulLife: z.coerce.number().int().positive().max(1200),
    version: optionalVersion,
  })
  .refine((value) => value.inServiceDate >= value.acquisitionDate, {
    message: "Tanggal in-service tidak boleh sebelum akuisisi.",
    path: ["inServiceDate"],
  })
  .refine((value) => value.residualValue < value.acquisitionCost, {
    message: "Nilai residu harus lebih kecil dari biaya perolehan.",
    path: ["residualValue"],
  });

export const assetCommandSchema = z.object({
  id: z.uuid(),
  version: optionalVersion,
});
export const depreciationSchema = z.object({
  id: z.uuid(),
  throughDate: z.iso.date(),
});
export const disposalSchema = z
  .object({
    disposalDate: z.iso.date(),
    gainLossAccountId: z.uuid(),
    id: z.uuid(),
    proceeds: z.coerce.number().nonnegative(),
    proceedsAccountId: optionalUuid,
    reason: z.string().trim().min(5).max(500),
  })
  .refine((value) => value.proceeds === 0 || Boolean(value.proceedsAccountId), {
    message: "Akun penerimaan wajib dipilih jika ada hasil disposal.",
    path: ["proceedsAccountId"],
  });
