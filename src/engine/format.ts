import { Decimal, D } from "./decimal";

export type Notation = "standard" | "scientific" | "engineering";

// The active display notation. `format`'s default reads this so every existing call site
// respects the player's setting without churn. Settings panel + load keep it in sync.
let currentNotation: Notation = "scientific";

export function setNotation(notation: Notation): void {
  currentNotation = notation;
}

export function getNotation(): Notation {
  return currentNotation;
}

// Uses break_eternity's `.mantissa`/`.exponent`, which are well-defined for normal
// magnitudes. Beyond that (layer 2+, where the exponent itself is astronomical) we
// defer to the library's native toString, which renders proper tower notation.
export function format(value: Decimal, notation: Notation = currentNotation, places = 2): string {
  if (value.eq(0)) return "0";
  if (value.lt(0)) return "-" + format(value.neg(), notation, places);

  // Small numbers: plain integers, or fixed decimals under 1000.
  if (value.lt(D(1000000))) {
    const n = value.toNumber();
    if (n < 1000) return Number.isInteger(n) ? `${n}` : n.toFixed(places);
    return Math.floor(n).toLocaleString();
  }

  const exp = value.exponent; // number
  const mantissa = value.mantissa; // number in [1, 10)

  // Past what mantissa/exponent can faithfully express, let the library render it.
  if (!Number.isFinite(exp) || !Number.isFinite(mantissa) || Math.abs(exp) > 1e9) {
    return value.toString();
  }

  if (notation === "engineering") {
    const e3 = Math.floor(exp / 3) * 3;
    const m = mantissa * 10 ** (exp - e3);
    return `${m.toFixed(places)}e${fmtExp(e3, places)}`;
  }

  // "scientific" (and "standard" falls back to scientific for huge numbers)
  return `${mantissa.toFixed(places)}e${fmtExp(exp, places)}`;
}

// Once the exponent itself has many digits ("1.23e456789012") it can overflow tight
// layouts, so past ~1e6 we render the exponent in scientific too ("1.23e1.00e6"). This
// caps the rendered width long before break_eternity's own tower notation (|exp| > 1e9).
const EXP_COMPACT_THRESHOLD = 1e6;
function fmtExp(exp: number, places: number): string {
  if (Math.abs(exp) < EXP_COMPACT_THRESHOLD) return `${exp}`;
  const e = Math.floor(Math.log10(Math.abs(exp)));
  const m = exp / 10 ** e;
  return `${m.toFixed(places)}e${e}`;
}
