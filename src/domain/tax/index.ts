import Decimal from "decimal.js";

import { decimal, roundMoney, type DecimalInput } from "@/domain/money";

export type TaxRateVersion = {
  effectiveFrom: string;
  effectiveTo: string | null;
  inclusive: boolean;
  rate: string;
  rounding: "down" | "half_up" | "up";
  scale: number;
};

export type TaxCalculation = {
  grossAmount: string;
  taxAmount: string;
  taxBase: string;
};

const roundingModes: Record<TaxRateVersion["rounding"], Decimal.Rounding> = {
  down: Decimal.ROUND_DOWN,
  half_up: Decimal.ROUND_HALF_UP,
  up: Decimal.ROUND_UP,
};

function assertIsoDate(value: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new Error("Tanggal pajak tidak valid.");
}

export function selectEffectiveTaxRate(
  versions: TaxRateVersion[],
  transactionDate: string,
): TaxRateVersion {
  assertIsoDate(transactionDate);
  const matches = versions
    .filter(
      (version) =>
        version.effectiveFrom <= transactionDate &&
        (!version.effectiveTo || version.effectiveTo >= transactionDate),
    )
    .sort((left, right) =>
      right.effectiveFrom.localeCompare(left.effectiveFrom),
    );

  if (matches.length === 0)
    throw new Error("Tarif pajak tidak tersedia untuk tanggal transaksi.");
  return matches[0];
}

export function calculateTax(
  amount: DecimalInput,
  version: Pick<TaxRateVersion, "inclusive" | "rate" | "rounding" | "scale">,
): TaxCalculation {
  const inputAmount = decimal(amount);
  const rate = decimal(version.rate).dividedBy(100);
  const rounding = roundingModes[version.rounding];
  if (inputAmount.isNegative() || rate.isNegative()) {
    throw new Error("Dasar dan tarif pajak tidak boleh negatif.");
  }

  if (version.inclusive) {
    const taxBase = roundMoney(
      inputAmount.dividedBy(rate.plus(1)),
      version.scale,
      rounding,
    );
    const taxAmount = inputAmount.minus(taxBase);
    return {
      grossAmount: inputAmount.toFixed(version.scale),
      taxAmount: taxAmount.toFixed(version.scale),
      taxBase: taxBase.toFixed(version.scale),
    };
  }

  const taxBase = roundMoney(inputAmount, version.scale, rounding);
  const taxAmount = roundMoney(taxBase.times(rate), version.scale, rounding);
  return {
    grossAmount: taxBase.plus(taxAmount).toFixed(version.scale),
    taxAmount: taxAmount.toFixed(version.scale),
    taxBase: taxBase.toFixed(version.scale),
  };
}
