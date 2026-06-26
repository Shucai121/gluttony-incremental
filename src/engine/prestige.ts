import { Decimal } from "./decimal";

// SPEC §2 reference formula. break_infinity's .log10() returns a JS number
// (break_eternity will return a Decimal — audit in Phase 7).
export function sinEssenceGain(souls: Decimal, hungerRatio: number): Decimal {
  const l = souls.max(1).log10(); // run size
  return new Decimal(Math.floor(10 ** Math.max(0, (l - 30) / 30)))
    .mul(1 + hungerRatio) // riding high hunger pays more
    .max(1);
}
