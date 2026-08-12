import Decimal from "decimal.js";

import { decimal } from "@/domain/money";

export type JournalLine = {
  accountId: string;
  credit: string;
  debit: string;
  description: string;
};

export type JournalBalance = {
  balanced: boolean;
  totalCredit: string;
  totalDebit: string;
};

export type SalesPostingMapping = {
  accountsReceivableId: string;
  outputTaxId?: string;
  salesRevenueId: string;
};

export function calculateJournalBalance(lines: JournalLine[]): JournalBalance {
  let totalDebit = new Decimal(0);
  let totalCredit = new Decimal(0);

  for (const line of lines) {
    const debit = decimal(line.debit);
    const credit = decimal(line.credit);
    if (debit.isNegative() || credit.isNegative()) {
      throw new Error("Debit dan kredit tidak boleh negatif.");
    }
    if (debit.greaterThan(0) === credit.greaterThan(0)) {
      throw new Error(
        "Setiap baris harus mempunyai tepat satu sisi debit atau kredit.",
      );
    }
    totalDebit = totalDebit.plus(debit);
    totalCredit = totalCredit.plus(credit);
  }

  return {
    balanced: lines.length >= 2 && totalDebit.equals(totalCredit),
    totalCredit: totalCredit.toFixed(2),
    totalDebit: totalDebit.toFixed(2),
  };
}

export function assertBalancedJournal(lines: JournalLine[]): JournalBalance {
  const balance = calculateJournalBalance(lines);
  if (lines.length < 2) throw new Error("Jurnal minimal memiliki dua baris.");
  if (!balance.balanced)
    throw new Error("Total debit dan kredit jurnal tidak seimbang.");
  return balance;
}

export function generateSalesInvoiceJournal(input: {
  description: string;
  mapping: SalesPostingMapping;
  subtotal: string;
  taxAmount: string;
  total: string;
}): JournalLine[] {
  const subtotal = decimal(input.subtotal);
  const taxAmount = decimal(input.taxAmount);
  const total = decimal(input.total);
  if (!subtotal.plus(taxAmount).equals(total)) {
    throw new Error("Komponen invoice tidak sama dengan total dokumen.");
  }
  if (taxAmount.greaterThan(0) && !input.mapping.outputTaxId) {
    throw new Error("Pemetaan akun pajak keluaran belum dikonfigurasi.");
  }

  const lines: JournalLine[] = [
    {
      accountId: input.mapping.accountsReceivableId,
      credit: "0.00",
      debit: total.toFixed(2),
      description: input.description,
    },
    {
      accountId: input.mapping.salesRevenueId,
      credit: subtotal.toFixed(2),
      debit: "0.00",
      description: input.description,
    },
  ];
  if (taxAmount.greaterThan(0) && input.mapping.outputTaxId) {
    lines.push({
      accountId: input.mapping.outputTaxId,
      credit: taxAmount.toFixed(2),
      debit: "0.00",
      description: input.description,
    });
  }

  assertBalancedJournal(lines);
  return lines;
}
