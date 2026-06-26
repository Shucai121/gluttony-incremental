import { Decimal } from "./decimal";

// SPEC §2 reference formula. break_eternity's .log10() returns a Decimal, so we
// take .toNumber() — a run's log-size comfortably fits a JS number.
export function sinEssenceGain(souls: Decimal, hungerRatio: number): Decimal {
  const l = souls.max(1).log10().toNumber(); // run size
  return new Decimal(Math.floor(10 ** Math.max(0, (l - 30) / 30)))
    .mul(1 + hungerRatio) // riding high hunger pays more
    .max(1);
}
