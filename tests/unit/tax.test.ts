import { describe, expect, it } from "vitest";

import {
  calculateTax,
  selectEffectiveTaxRate,
  type TaxRateVersion,
} from "@/domain/tax";

const exclusive: TaxRateVersion = {
  effectiveFrom: "2026-01-01",
  effectiveTo: null,
  inclusive: false,
  rate: "11",
  rounding: "half_up",
  scale: 2,
};

describe("tax engine", () => {
  it("calculates exclusive tax", () => {
    expect(calculateTax("100000", exclusive)).toEqual({
      grossAmount: "111000.00",
      taxAmount: "11000.00",
      taxBase: "100000.00",
    });
  });

  it("extracts inclusive tax", () => {
    expect(calculateTax("111000", { ...exclusive, inclusive: true })).toEqual({
      grossAmount: "111000.00",
      taxAmount: "11000.00",
      taxBase: "100000.00",
    });
  });

  it("uses effective-dated versions without rewriting history", () => {
    const oldVersion = {
      ...exclusive,
      effectiveFrom: "2025-01-01",
      effectiveTo: "2025-12-31",
      rate: "10",
    };
    expect(
      selectEffectiveTaxRate([exclusive, oldVersion], "2025-06-30").rate,
    ).toBe("10");
    expect(
      selectEffectiveTaxRate([exclusive, oldVersion], "2026-06-30").rate,
    ).toBe("11");
    expect(() => selectEffectiveTaxRate([exclusive], "2025-06-30")).toThrow(
      "Tarif pajak tidak tersedia",
    );
  });

  it("applies configured rounding", () => {
    expect(
      calculateTax("100.05", {
        ...exclusive,
        rate: "10",
        scale: 0,
        rounding: "down",
      }).taxAmount,
    ).toBe("10");
    expect(
      calculateTax("100.05", {
        ...exclusive,
        rate: "10",
        scale: 0,
        rounding: "up",
      }).taxAmount,
    ).toBe("11");
  });
});
