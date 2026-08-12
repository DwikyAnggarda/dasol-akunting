import { z } from "zod";
export const returnKindSchema = z.enum(["sales_return", "purchase_return"]);
export type ReturnKind = z.infer<typeof returnKindSchema>;
const optionalUuid = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.uuid().optional(),
);
export const returnSchema = z.object({
  id: optionalUuid,
  kind: returnKindSchema,
  lines: z
    .array(
      z.object({
        quantity: z.coerce.number().positive(),
        sourceLineId: z.uuid(),
        warehouseId: optionalUuid,
      }),
    )
    .min(1)
    .max(200),
  reason: z.string().trim().min(5).max(500),
  returnDate: z.iso.date(),
  sourceInvoiceId: z.uuid(),
  version: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce.number().int().positive().optional(),
  ),
});
export const returnCommandSchema = z.object({
  action: z.enum(["approve", "reject"]).optional(),
  comment: z.string().trim().max(500).optional(),
  id: z.uuid(),
  kind: returnKindSchema,
  version: z.coerce.number().int().positive().optional(),
});
export const returnReversalSchema = z.object({
  id: z.uuid(),
  kind: returnKindSchema,
  reason: z.string().trim().min(5),
  reversalDate: z.iso.date(),
});
