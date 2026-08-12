export type NumberingContext = {
  branchCode?: string;
  companyCode: string;
  date: string;
  documentType: string;
  sequence: number;
};

export function formatDocumentNumber(
  pattern: string,
  context: NumberingContext,
): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(context.date))
    throw new Error("Tanggal dokumen tidak valid.");
  if (!Number.isSafeInteger(context.sequence) || context.sequence < 1) {
    throw new Error("Urutan dokumen tidak valid.");
  }
  const [year, month] = context.date.split("-");
  const sequenceToken = pattern.match(/\{(#+)\}/);
  let result = pattern
    .replaceAll("{TYPE}", context.documentType)
    .replaceAll("{COMPANY}", context.companyCode)
    .replaceAll("{BRANCH}", context.branchCode ?? "")
    .replaceAll("{YYYY}", year)
    .replaceAll("{MM}", month);
  if (sequenceToken) {
    result = result.replace(
      sequenceToken[0],
      String(context.sequence).padStart(sequenceToken[1].length, "0"),
    );
  }
  if (/\{[^}]+\}/.test(result))
    throw new Error("Pola nomor dokumen memiliki token yang tidak didukung.");
  return result;
}
