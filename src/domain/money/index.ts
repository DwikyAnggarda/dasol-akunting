import Decimal from "decimal.js";

export type DecimalInput = Decimal | string;

const INDONESIAN_MONEY_PATTERN =
  /^-?\d{1,3}(?:\.\d{3})*(?:,\d+)?$|^-?\d+(?:,\d+)?$/;

export function decimal(value: DecimalInput): Decimal {
  return value instanceof Decimal ? value : new Decimal(value);
}

export function parseIndonesianMoney(input: string): Decimal {
  const normalized = input
    .trim()
    .replace(/^Rp\s*/i, "")
    .replace(/\s/g, "");

  if (!INDONESIAN_MONEY_PATTERN.test(normalized)) {
    throw new Error("Format nominal tidak valid.");
  }

  return new Decimal(normalized.replace(/\./g, "").replace(",", "."));
}

export function roundMoney(
  value: DecimalInput,
  scale = 2,
  rounding: Decimal.Rounding = Decimal.ROUND_HALF_UP,
): Decimal {
  return decimal(value).toDecimalPlaces(scale, rounding);
}

export function formatDecimal(
  value: DecimalInput,
  options: { maximumScale?: number; minimumScale?: number } = {},
): string {
  const maximumScale = options.maximumScale ?? 2;
  const minimumScale = options.minimumScale ?? 0;
  const rounded = decimal(value).toDecimalPlaces(
    maximumScale,
    Decimal.ROUND_HALF_UP,
  );
  const raw = rounded.toFixed(maximumScale);
  const [integerPart, decimalPart = ""] = raw.split(".");
  const negative = integerPart.startsWith("-");
  const digits = negative ? integerPart.slice(1) : integerPart;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const trimmedDecimals = decimalPart
    .replace(/0+$/, "")
    .padEnd(minimumScale, "0");
  return `${negative ? "-" : ""}${grouped}${trimmedDecimals ? `,${trimmedDecimals}` : ""}`;
}

export function formatIDR(value: DecimalInput): string {
  return `Rp ${formatDecimal(value, { maximumScale: 2 })}`;
}
