import { z } from "zod";
const optionalUuid = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.uuid().optional(),
);
export const statementLineSchema = z.object({
  amount: z.coerce.number().refine((value) => value !== 0),
  description: z.string().trim().min(2).max(300),
  reference: z.string().trim().max(100).optional(),
  transactionDate: z.iso.date(),
});
export const reconciliationSchema = z.object({
  bankAccountId: z.uuid(),
  closingBalance: z.coerce.number(),
  id: optionalUuid,
  lines: z.array(statementLineSchema).min(1).max(5000),
  openingBalance: z.coerce.number(),
  statementDate: z.iso.date(),
  version: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce.number().int().positive().optional(),
  ),
});
export const matchSchema = z.object({
  candidate: z
    .string()
    .regex(
      /^(customer_receipt|supplier_payment|cash_transaction):[0-9a-f-]{36}$/,
    ),
  lineId: z.uuid(),
  reconciliationId: z.uuid(),
});
export const lineCommandSchema = z.object({
  lineId: z.uuid(),
  reconciliationId: z.uuid(),
});
export const adjustmentSchema = lineCommandSchema.extend({
  description: z.string().trim().min(5).max(300),
  offsetAccountId: z.uuid(),
});
export const finalizeSchema = z.object({ id: z.uuid() });
