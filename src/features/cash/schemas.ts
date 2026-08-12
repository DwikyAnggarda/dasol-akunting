import { z } from "zod";
const optionalUuid = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.uuid().optional(),
);
export const cashTransactionSchema = z
  .object({
    amount: z.coerce.number().positive(),
    bankAccountId: z.uuid(),
    branchId: z.uuid(),
    description: z.string().trim().min(3).max(500),
    destinationBankAccountId: optionalUuid,
    id: optionalUuid,
    offsetAccountId: optionalUuid,
    reference: z.string().trim().max(100).optional(),
    transactionDate: z.iso.date(),
    transactionType: z.enum(["bank_transfer", "cash_in", "cash_out"]),
    version: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.coerce.number().int().positive().optional(),
    ),
  })
  .superRefine((value, context) => {
    if (
      value.transactionType === "bank_transfer" &&
      !value.destinationBankAccountId
    )
      context.addIssue({
        code: "custom",
        message: "Pilih akun tujuan transfer.",
        path: ["destinationBankAccountId"],
      });
    if (value.transactionType !== "bank_transfer" && !value.offsetAccountId)
      context.addIssue({
        code: "custom",
        message: "Pilih akun lawan.",
        path: ["offsetAccountId"],
      });
  });
export const cashCommandSchema = z.object({
  action: z.enum(["approve", "reject"]).optional(),
  comment: z.string().trim().max(500).optional(),
  id: z.uuid(),
  version: z.coerce.number().int().positive().optional(),
});
export const cashReversalSchema = z.object({
  id: z.uuid(),
  reason: z.string().trim().min(5),
  reversalDate: z.iso.date(),
});
