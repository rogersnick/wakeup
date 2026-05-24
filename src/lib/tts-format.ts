export function formatSpokenDollars(amount: number): string {
  const rounded = Math.round(Math.abs(amount) * 100) / 100;
  const dollars = Math.floor(rounded);
  const cents = Math.round((rounded - dollars) * 100);

  if (dollars === 0 && cents > 0) {
    return `${cents} cent${cents === 1 ? "" : "s"}`;
  }

  if (cents === 0) {
    return `${dollars} dollar${dollars === 1 ? "" : "s"}`;
  }

  return `${dollars} dollar${dollars === 1 ? "" : "s"} and ${cents} cent${cents === 1 ? "" : "s"}`;
}

export function formatSpokenPercent(value: number): string {
  const abs = Math.abs(value);
  const fixed = abs.toFixed(1);
  const [whole, decimal = "0"] = fixed.split(".");

  if (decimal === "0") {
    return `${whole} percent`;
  }

  return `${whole} point ${decimal} percent`;
}

const DOLLAR_PATTERN = /\$(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/g;
const DECIMAL_PERCENT_PATTERN = /(?<![\d-])(\d+)\.(\d+) percent/gi;

export function normalizeScriptForSpeech(text: string): string {
  let result = text.replace(DOLLAR_PATTERN, (_, amount: string) => {
    const value = Number.parseFloat(amount.replace(/,/g, ""));
    if (!Number.isFinite(value)) {
      return `$${amount}`;
    }
    return formatSpokenDollars(value);
  });

  result = result.replace(
    DECIMAL_PERCENT_PATTERN,
    (_, whole: string, decimal: string) => {
      const trimmedDecimal = decimal.replace(/0+$/, "");
      if (!trimmedDecimal) {
        return `${whole} percent`;
      }
      return `${whole} point ${trimmedDecimal} percent`;
    },
  );

  return result;
}
