import { describe, expect, it } from "vitest";
import {
  genericCsvTaxAdapter,
  genericXmlTaxAdapter,
  type TaxExportRecord,
} from "@/domain/tax/export";
const record: TaxExportRecord = {
  documentDate: "2026-08-12",
  documentNumber: 'SI-"001"',
  partnerName: "A & B <Demo>",
  rate: "11",
  taxAmount: "11000.00",
  taxBase: "100000.00",
  taxCode: "PPN-DEMO",
};
describe("generic tax export adapters", () => {
  it("escapes CSV and labels output as demo", () => {
    const result = genericCsvTaxAdapter.generate([record]);
    expect(result.content).toContain('"SI-""001"""');
    expect(result.notice).toBe("DEMO / NOT FOR OFFICIAL SUBMISSION");
  });
  it("escapes XML without claiming an official schema", () => {
    const result = genericXmlTaxAdapter.generate([record]);
    expect(result.content).toContain("A &amp; B &lt;Demo&gt;");
    expect(result.content).toContain("DEMO / NOT FOR OFFICIAL SUBMISSION");
  });
  it("rejects malformed decimal values", () => {
    expect(
      genericCsvTaxAdapter.validate([{ ...record, taxAmount: "Rp 1.000" }])
        .valid,
    ).toBe(false);
  });
});
