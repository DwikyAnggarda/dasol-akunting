import { z } from "zod";
export const operationalKindSchema = z.enum([
  "goods_receipt",
  "purchase_request",
  "purchase_order",
  "sales_delivery",
  "sales_quotation",
  "sales_order",
]);
export type OperationalKind = z.infer<typeof operationalKindSchema>;
const optionalUuid = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.uuid().optional(),
);
export const operationalLineSchema = z.object({
  description: z.string().trim().min(2).max(300),
  productId: z.uuid(),
  quantity: z.coerce.number().positive(),
  sourceLineId: optionalUuid,
  unitAmount: z.coerce.number().nonnegative(),
  warehouseId: z.uuid(),
});
export const operationalDocumentSchema = z.object({
  branchId: z.uuid(),
  contactId: z.uuid(),
  documentDate: z.iso.date(),
  id: optionalUuid,
  kind: operationalKindSchema,
  lines: z.array(operationalLineSchema).min(1).max(200),
  notes: z.string().trim().max(1000).optional(),
  version: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce.number().int().positive().optional(),
  ),
});
export const operationalCommandSchema = z.object({
  action: z.enum(["approve", "reject"]).optional(),
  comment: z.string().trim().max(500).optional(),
  id: z.uuid(),
  kind: operationalKindSchema,
  version: z.coerce.number().int().positive().optional(),
});
export const operationalReversalSchema = z.object({
  id: z.uuid(),
  kind: operationalKindSchema,
  reason: z.string().trim().min(5),
  reversalDate: z.iso.date(),
});
