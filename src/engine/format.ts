import { Decimal, D } from "./decimal";

export type Notation = "standard" | "scientific" | "engineering";

// Uses break_eternity's `.mantissa`/`.exponent`, which are well-defined for normal
// magnitudes. Beyond that (layer 2+, where the exponent itself is astronomical) we
// defer to the library's native toString, which renders proper tower notation.
export function format(value: Decimal, notation: Notation = "scientific", places = 2): string {
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
    return `${m.toFixed(places)}e${e3}`;
  }

  // "scientific" (and "standard" falls back to scientific for huge numbers)
  return `${mantissa.toFixed(places)}e${exp}`;
}
