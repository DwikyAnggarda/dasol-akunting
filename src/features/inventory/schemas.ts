import { z } from "zod";

const optionalUuid = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.uuid().optional(),
);

export const adjustmentLineSchema = z.object({
  productId: z.uuid("Pilih produk."),
  quantity: z.coerce.number().positive("Kuantitas harus lebih dari nol."),
  unitCost: z.coerce.number().nonnegative("Biaya tidak boleh negatif."),
});

export const adjustmentSchema = z.object({
  adjustmentDate: z.iso.date(),
  adjustmentType: z.enum(["increase", "decrease"]),
  branchId: z.uuid("Pilih cabang."),
  id: optionalUuid,
  lines: z.array(adjustmentLineSchema).min(1).max(200),
  offsetAccountId: z.uuid("Pilih akun lawan."),
  reason: z.string().trim().min(5, "Alasan minimal lima karakter.").max(500),
  version: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce.number().int().positive().optional(),
  ),
  warehouseId: z.uuid("Pilih gudang."),
});

export const adjustmentCommandSchema = z.object({
  action: z.enum(["approve", "reject"]).optional(),
  comment: z.string().trim().max(500).optional(),
  id: z.uuid(),
  version: z.coerce.number().int().positive().optional(),
});

export const adjustmentReversalSchema = z.object({
  id: z.uuid(),
  reason: z.string().trim().min(5, "Alasan minimal lima karakter."),
  reversalDate: z.iso.date(),
});

export const inventoryOperationTypeSchema = z.enum([
  "inventory_transfer",
  "stock_count",
]);
export type InventoryOperationType = z.infer<
  typeof inventoryOperationTypeSchema
>;

const operationLineSchema = z.object({
  countedQuantity: z.coerce.number().nonnegative().optional(),
  productId: z.uuid("Pilih produk."),
  quantity: z.coerce.number().positive().optional(),
});

export const inventoryOperationSchema = z
  .object({
    branchId: z.uuid("Pilih cabang."),
    destinationWarehouseId: optionalUuid,
    id: optionalUuid,
    lines: z.array(operationLineSchema).min(1).max(500),
    offsetAccountId: optionalUuid,
    operationDate: z.iso.date(),
    operationType: inventoryOperationTypeSchema,
    reason: z.string().trim().min(5).max(500),
    sourceWarehouseId: z.uuid("Pilih gudang."),
    version: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.coerce.number().int().positive().optional(),
    ),
  })
  .superRefine((data, context) => {
    if (
      data.operationType === "inventory_transfer" &&
      (!data.destinationWarehouseId ||
        data.destinationWarehouseId === data.sourceWarehouseId)
    )
      context.addIssue({
        code: "custom",
        message: "Gudang tujuan harus berbeda dari gudang sumber.",
        path: ["destinationWarehouseId"],
      });
    if (data.operationType === "stock_count" && !data.offsetAccountId)
      context.addIssue({
        code: "custom",
        message: "Pilih akun lawan selisih opname.",
        path: ["offsetAccountId"],
      });
    data.lines.forEach((line, index) => {
      if (data.operationType === "inventory_transfer" && !line.quantity)
        context.addIssue({
          code: "custom",
          message: "Kuantitas transfer wajib diisi.",
          path: ["lines", index, "quantity"],
        });
      if (
        data.operationType === "stock_count" &&
        line.countedQuantity === undefined
      )
        context.addIssue({
          code: "custom",
          message: "Hasil hitung wajib diisi.",
          path: ["lines", index, "countedQuantity"],
        });
    });
  });

export const inventoryOperationCommandSchema = z.object({
  action: z.enum(["approve", "reject"]).optional(),
  comment: z.string().trim().max(500).optional(),
  id: z.uuid(),
  operationType: inventoryOperationTypeSchema,
  version: z.coerce.number().int().positive().optional(),
});
