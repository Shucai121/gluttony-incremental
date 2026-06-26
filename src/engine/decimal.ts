import Decimal from "break_eternity.js";

export { Decimal };
export type DecimalSource = Decimal | number | string;

export const D = (x: DecimalSource): Decimal => new Decimal(x);
export const ZERO = new Decimal(0);
export const ONE = new Decimal(1);

/** Cost of the (purchased)-th buy: base * mult^purchased (geometric). */
export const geometricCost = (
  base: DecimalSource,
  mult: DecimalSource,
  purchased: DecimalSource,
): Decimal => D(base).mul(D(mult).pow(D(purchased)));
