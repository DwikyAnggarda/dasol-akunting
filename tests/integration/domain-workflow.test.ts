import { describe, expect, it } from "vitest";

import { calculateInvoice } from "@/domain/accounting/invoice";
import {
  assertBalancedJournal,
  generateSalesInvoiceJournal,
} from "@/domain/accounting/journal";

describe("sales invoice to journal integration", () => {
  it("carries recalculated invoice values into a balanced journal", () => {
    const invoice = calculateInvoice([
      {
        discountRate: "5",
        quantity: "10",
        tax: { inclusive: false, rate: "11", rounding: "half_up", scale: 2 },
        unitPrice: "12500",
      },
    ]);
    const journal = generateSalesInvoiceJournal({
      description: "Invoice integration",
      mapping: {
        accountsReceivableId: "ar",
        outputTaxId: "tax",
        salesRevenueId: "sales",
      },
      subtotal: invoice.subtotal,
      taxAmount: invoice.tax,
      total: invoice.total,
    });

    expect(invoice.total).toBe("131812.50");
    expect(assertBalancedJournal(journal)).toEqual({
      balanced: true,
      totalCredit: "131812.50",
      totalDebit: "131812.50",
    });
  });
});
