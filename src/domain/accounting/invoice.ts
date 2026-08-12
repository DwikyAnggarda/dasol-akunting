import Decimal from "decimal.js";

import { decimal, roundMoney } from "@/domain/money";
import { calculateTax, type TaxRateVersion } from "@/domain/tax";

export type InvoiceLineInput = {
  discountRate: string;
  quantity: string;
  tax?: Pick<TaxRateVersion, "inclusive" | "rate" | "rounding" | "scale">;
  unitPrice: string;
};

export type InvoiceTotals = {
  discount: string;
  gross: string;
  subtotal: string;
  tax: string;
  total: string;
};

export function calculateInvoice(
  lines: InvoiceLineInput[],
  documentDiscount = "0",
): InvoiceTotals {
  if (lines.length === 0)
    throw new Error("Invoice minimal memiliki satu baris.");
  let gross = new Decimal(0);
  let lineDiscount = new Decimal(0);
  let subtotal = new Decimal(0);
  let tax = new Decimal(0);

  for (const line of lines) {
    const quantity = decimal(line.quantity);
    const unitPrice = decimal(line.unitPrice);
    const discountRate = decimal(line.discountRate);
    if (!quantity.isPositive() || unitPrice.isNegative()) {
      throw new Error("Kuantitas harus positif dan harga tidak boleh negatif.");
    }
    if (discountRate.isNegative() || discountRate.greaterThan(100)) {
      throw new Error("Diskon harus berada antara 0 dan 100 persen.");
    }

    const lineGross = roundMoney(quantity.times(unitPrice), 2);
    const discount = roundMoney(
      lineGross.times(discountRate).dividedBy(100),
      2,
    );
    const afterDiscount = lineGross.minus(discount);
    gross = gross.plus(lineGross);
    lineDiscount = lineDiscount.plus(discount);

    if (line.tax) {
      const calculated = calculateTax(afterDiscount, line.tax);
      subtotal = subtotal.plus(calculated.taxBase);
      tax = tax.plus(calculated.taxAmount);
    } else {
      subtotal = subtotal.plus(afterDiscount);
    }
  }

  const documentDiscountValue = decimal(documentDiscount);
  if (
    documentDiscountValue.isNegative() ||
    documentDiscountValue.greaterThan(subtotal)
  ) {
    throw new Error("Potongan dokumen tidak valid.");
  }
  const netSubtotal = subtotal.minus(documentDiscountValue);
  const total = netSubtotal.plus(tax);

  return {
    discount: lineDiscount.plus(documentDiscountValue).toFixed(2),
    gross: gross.toFixed(2),
    subtotal: netSubtotal.toFixed(2),
    tax: tax.toFixed(2),
    total: total.toFixed(2),
  };
}
