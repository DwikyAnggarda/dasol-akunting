import { describe, expect, it } from "vitest";

import { calculateInvoice } from "@/domain/accounting/invoice";
import {
  assertBalancedJournal,
  calculateJournalBalance,
  generateSalesInvoiceJournal,
} from "@/domain/accounting/journal";

describe("invoice calculation", () => {
  it("calculates quantity, line discount, tax, and total", () => {
    expect(
      calculateInvoice([
        {
          discountRate: "10",
          quantity: "2",
          tax: { inclusive: false, rate: "11", rounding: "half_up", scale: 2 },
          unitPrice: "100000",
        },
      ]),
    ).toEqual({
      discount: "20000.00",
      gross: "200000.00",
      subtotal: "180000.00",
      tax: "19800.00",
      total: "199800.00",
    });
  });

  it("applies a fixed document discount", () => {
    expect(
      calculateInvoice(
        [{ discountRate: "0", quantity: "3", unitPrice: "50000" }],
        "10000",
      ).total,
    ).toBe("140000.00");
  });
});

describe("journal invariants", () => {
  it("generates a balanced sales journal from configurable mappings", () => {
    const lines = generateSalesInvoiceJournal({
      description: "SI-2026-08-0001",
      mapping: {
        accountsReceivableId: "account-ar",
        outputTaxId: "account-tax",
        salesRevenueId: "account-sales",
      },
      subtotal: "180000.00",
      taxAmount: "19800.00",
      total: "199800.00",
    });
    expect(lines).toHaveLength(3);
    expect(calculateJournalBalance(lines)).toEqual({
      balanced: true,
      totalCredit: "199800.00",
      totalDebit: "199800.00",
    });
  });

  it("rejects unbalanced or invalid lines", () => {
    expect(() =>
      assertBalancedJournal([
        { accountId: "a", credit: "0", debit: "100", description: "x" },
        { accountId: "b", credit: "90", debit: "0", description: "x" },
      ]),
    ).toThrow("tidak seimbang");
    expect(() =>
      calculateJournalBalance([
        { accountId: "a", credit: "10", debit: "10", description: "x" },
      ]),
    ).toThrow("tepat satu sisi");
  });

  it("keeps generated journal balanced across representative values", () => {
    for (const subtotal of ["0.01", "100", "999999999999999.99"]) {
      const lines = generateSalesInvoiceJournal({
        description: "property",
        mapping: { accountsReceivableId: "ar", salesRevenueId: "sales" },
        subtotal,
        taxAmount: "0",
        total: subtotal,
      });
      expect(assertBalancedJournal(lines).balanced).toBe(true);
    }
  });
});
