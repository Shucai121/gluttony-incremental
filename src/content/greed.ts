import { D, Decimal } from "../engine/decimal";
import { StatId } from "../state/types";

export interface GreedForm {
  name: string;
  damageMult: Decimal;
  unlockCost: {
    souls: Decimal;
    stats: Record<StatId, Decimal>;
  };
  special: string;
}

const noStatCost = {
  STR: D(0),
  VIT: D(0),
  AGI: D(0),
  DEX: D(0),
  MAG: D(0),
  MND: D(0),
};

export const GREED_FORMS: GreedForm[] = [
  {
    name: "Black Sword",
    damageMult: D(1),
    unlockCost: { souls: D(0), stats: noStatCost },
    special: "Dormant edge.",
  },
  {
    name: "Scythe",
    damageMult: D(3),
    unlockCost: {
      souls: D("1e3"),
      stats: { ...noStatCost, STR: D(1), VIT: D(1) },
    },
    special: "A wider killing arc.",
  },
  {
    name: "Bow",
    damageMult: D(12),
    unlockCost: {
      souls: D("1e5"),
      stats: { ...noStatCost, AGI: D(5), DEX: D(5), VIT: D(3) },
    },
    special: "Ranged pursuit.",
  },
  {
    name: "Bloody Frame",
    damageMult: D(60),
    unlockCost: {
      souls: D("1e8"),
      stats: { ...noStatCost, STR: D(20), VIT: D(25), MND: D(10) },
    },
    special: "Blood-fed overdrive.",
  },
];

export const GREED_BURST = {
  damageMult: D(5),
  durationSec: D(10),
  vitCost: D(5),
};
