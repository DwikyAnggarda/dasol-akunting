import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";

import {
  decimal,
  formatDecimal,
  formatIDR,
  parseIndonesianMoney,
  roundMoney,
} from "@/domain/money";

describe("money", () => {
  it("parses Indonesian currency without floating-point conversion", () => {
    expect(parseIndonesianMoney("Rp 1.234.567,89").toFixed(2)).toBe(
      "1234567.89",
    );
    expect(parseIndonesianMoney("-10.000").toFixed(2)).toBe("-10000.00");
  });

  it("rejects ambiguous or malformed input", () => {
    expect(() => parseIndonesianMoney("1,2,3")).toThrow(
      "Format nominal tidak valid",
    );
    expect(() => parseIndonesianMoney("1.23")).toThrow(
      "Format nominal tidak valid",
    );
  });

  it("formats large values without losing precision", () => {
    expect(formatIDR("900719925474099312345.5")).toBe(
      "Rp 900.719.925.474.099.312.345,5",
    );
    expect(formatDecimal("-1250.4", { maximumScale: 2, minimumScale: 2 })).toBe(
      "-1.250,40",
    );
  });

  it("rounds with explicit decimal rules", () => {
    expect(roundMoney("10.005", 2).toFixed(2)).toBe("10.01");
    expect(roundMoney("10.009", 2, Decimal.ROUND_DOWN).toFixed(2)).toBe(
      "10.00",
    );
    expect(decimal("0.1").plus("0.2").toFixed(1)).toBe("0.3");
  });
});
