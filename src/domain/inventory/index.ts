import { decimal, type DecimalInput } from "@/domain/money";

export type InventoryBalance = {
  averageCost: string;
  quantity: string;
  value: string;
};

export function receiveAtMovingAverage(input: {
  currentAverageCost: DecimalInput;
  currentQuantity: DecimalInput;
  receivedQuantity: DecimalInput;
  receivedUnitCost: DecimalInput;
}): InventoryBalance {
  const currentQuantity = decimal(input.currentQuantity);
  const currentAverageCost = decimal(input.currentAverageCost);
  const receivedQuantity = decimal(input.receivedQuantity);
  const receivedUnitCost = decimal(input.receivedUnitCost);
  if (currentQuantity.isNegative() || !receivedQuantity.isPositive()) {
    throw new Error("Kuantitas penerimaan tidak valid.");
  }
  if (currentAverageCost.isNegative() || receivedUnitCost.isNegative()) {
    throw new Error("Biaya persediaan tidak boleh negatif.");
  }

  const quantity = currentQuantity.plus(receivedQuantity);
  const value = currentQuantity
    .times(currentAverageCost)
    .plus(receivedQuantity.times(receivedUnitCost));
  const averageCost = value.dividedBy(quantity);
  return {
    averageCost: averageCost.toDecimalPlaces(6).toFixed(6),
    quantity: quantity.toDecimalPlaces(6).toFixed(6),
    value: value.toDecimalPlaces(2).toFixed(2),
  };
}

export function assertSufficientStock(
  onHand: DecimalInput,
  requested: DecimalInput,
): void {
  const onHandValue = decimal(onHand);
  const requestedValue = decimal(requested);
  if (!requestedValue.isPositive())
    throw new Error("Kuantitas keluar harus positif.");
  if (onHandValue.minus(requestedValue).isNegative()) {
    throw new Error("Stok tidak mencukupi dan stok negatif tidak diizinkan.");
  }
}
