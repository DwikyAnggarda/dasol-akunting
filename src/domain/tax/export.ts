export type TaxExportRecord = {
  documentDate: string;
  documentNumber: string;
  partnerName: string;
  rate: string;
  taxAmount: string;
  taxBase: string;
  taxCode: string;
};

export type ValidationResult = { errors: string[]; valid: boolean };
export type ExportArtifact = {
  content: string;
  filename: string;
  mediaType: string;
  notice: string;
};

export interface TaxExportAdapter {
  code: string;
  version: string;
  generate(input: TaxExportRecord[]): ExportArtifact;
  validate(input: TaxExportRecord[]): ValidationResult;
}

function validateRecords(records: TaxExportRecord[]): ValidationResult {
  const errors = records.flatMap((record, index) => {
    const row = index + 1;
    const issues: string[] = [];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(record.documentDate))
      issues.push(`Baris ${row}: tanggal tidak valid.`);
    if (!record.documentNumber.trim())
      issues.push(`Baris ${row}: nomor dokumen wajib diisi.`);
    if (
      !/^-?\d+(?:\.\d+)?$/.test(record.taxBase) ||
      !/^-?\d+(?:\.\d+)?$/.test(record.taxAmount) ||
      !/^-?\d+(?:\.\d+)?$/.test(record.rate)
    )
      issues.push(`Baris ${row}: nilai pajak harus berupa desimal murni.`);
    return issues;
  });
  return { errors, valid: errors.length === 0 };
}

function csvCell(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}
function xmlText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export const genericCsvTaxAdapter: TaxExportAdapter = {
  code: "generic_csv",
  version: "1.0.0",
  validate: validateRecords,
  generate(records) {
    const validation = validateRecords(records);
    if (!validation.valid) throw new Error(validation.errors.join(" "));
    const header = [
      "document_number",
      "document_date",
      "partner_name",
      "tax_code",
      "tax_base",
      "rate",
      "tax_amount",
    ];
    const lines = records.map((r) =>
      [
        r.documentNumber,
        r.documentDate,
        r.partnerName,
        r.taxCode,
        r.taxBase,
        r.rate,
        r.taxAmount,
      ]
        .map(csvCell)
        .join(","),
    );
    return {
      content: [header.join(","), ...lines].join("\r\n"),
      filename: "dasol-tax-demo.csv",
      mediaType: "text/csv",
      notice: "DEMO / NOT FOR OFFICIAL SUBMISSION",
    };
  },
};

export const genericXmlTaxAdapter: TaxExportAdapter = {
  code: "generic_xml",
  version: "1.0.0",
  validate: validateRecords,
  generate(records) {
    const validation = validateRecords(records);
    if (!validation.valid) throw new Error(validation.errors.join(" "));
    const body = records
      .map(
        (r) =>
          `  <record documentNumber="${xmlText(r.documentNumber)}"><documentDate>${xmlText(r.documentDate)}</documentDate><partnerName>${xmlText(r.partnerName)}</partnerName><taxCode>${xmlText(r.taxCode)}</taxCode><taxBase>${xmlText(r.taxBase)}</taxBase><rate>${xmlText(r.rate)}</rate><taxAmount>${xmlText(r.taxAmount)}</taxAmount></record>`,
      )
      .join("\n");
    return {
      content: `<?xml version="1.0" encoding="UTF-8"?>\n<!-- DEMO / NOT FOR OFFICIAL SUBMISSION -->\n<dasolTaxExport adapterVersion="1.0.0">\n${body}\n</dasolTaxExport>`,
      filename: "dasol-tax-demo.xml",
      mediaType: "application/xml",
      notice: "DEMO / NOT FOR OFFICIAL SUBMISSION",
    };
  },
};
