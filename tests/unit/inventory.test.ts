import { describe, expect, it } from "vitest";

import {
  assertSufficientStock,
  receiveAtMovingAverage,
} from "@/domain/inventory";

describe("moving weighted-average inventory", () => {
  it("recalculates cost from exact decimal values", () => {
    expect(
      receiveAtMovingAverage({
        currentAverageCost: "10000",
        currentQuantity: "10",
        receivedQuantity: "5",
        receivedUnitCost: "13000",
      }),
    ).toEqual({
      averageCost: "11000.000000",
      quantity: "15.000000",
      value: "165000.00",
    });
  });

  it("blocks negative stock", () => {
    expect(() => assertSufficientStock("3.5", "4")).toThrow(
      "Stok tidak mencukupi",
    );
    expect(() => assertSufficientStock("3.5", "3.5")).not.toThrow();
  });
});
