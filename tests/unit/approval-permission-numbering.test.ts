import { describe, expect, it } from "vitest";

import {
  assertCanApprove,
  assertTransition,
  canTransition,
} from "@/domain/approvals";
import { formatDocumentNumber } from "@/domain/accounting/numbering";
import { hasEveryPermission, hasPermission } from "@/domain/permissions";

describe("document lifecycle", () => {
  it("allows only declared transitions", () => {
    expect(canTransition("draft", "submitted")).toBe(true);
    expect(canTransition("posted", "draft")).toBe(false);
    expect(() => assertTransition("approved", "draft")).toThrow(
      "tidak diizinkan",
    );
  });

  it("blocks self approval by default", () => {
    expect(() =>
      assertCanApprove({
        allowSelfApproval: false,
        approverId: "user-a",
        createdBy: "user-a",
        permissions: ["sales.approve"],
        requiredPermission: "sales.approve",
      }),
    ).toThrow("dokumennya sendiri");
  });
});

describe("permissions", () => {
  it("requires explicit permission codes", () => {
    const granted = ["sales.read", "sales.create"];
    expect(hasPermission(granted, "sales.read")).toBe(true);
    expect(hasPermission(granted, "sales.approve")).toBe(false);
    expect(hasEveryPermission(granted, ["sales.read", "sales.create"])).toBe(
      true,
    );
  });
});

describe("document numbering", () => {
  it("formats supported tokens and sequence width", () => {
    expect(
      formatDocumentNumber("{TYPE}-{COMPANY}-{YYYY}-{MM}-{####}", {
        companyCode: "DAS",
        date: "2026-08-12",
        documentType: "SI",
        sequence: 42,
      }),
    ).toBe("SI-DAS-2026-08-0042");
  });

  it("rejects unsupported tokens", () => {
    expect(() =>
      formatDocumentNumber("SI-{DAY}-{####}", {
        companyCode: "DAS",
        date: "2026-08-12",
        documentType: "SI",
        sequence: 1,
      }),
    ).toThrow("token yang tidak didukung");
  });
});
