import { D, Decimal } from "../engine/decimal";

export interface PerkDef {
  id: string;
  name: string;
  description: string;
  cost: Decimal; // in Divinity
  mult: Decimal; // global multiplier while owned
}

// Domain Perks are the permanent payoff for Transcending — independently buyable
// with Divinity, each a flat global multiplier that survives every future reset.
export const PERKS: PerkDef[] = [
  {
    id: "domain-power",
    name: "Domain of Power",
    description: "Your hunger reshapes reality. ×5 to all gains, forever.",
    cost: D(1),
    mult: D(5),
  },
  {
    id: "domain-greed",
    name: "Domain of Greed",
    description: "Greed answers to a god now. ×10 to all gains, forever.",
    cost: D(3),
    mult: D(10),
  },
  {
    id: "domain-eternity",
    name: "Domain of Eternity",
    description: "Time itself is devoured. ×100 to all gains, forever.",
    cost: D(10),
    mult: D(100),
  },
];

export function perkById(id: string): PerkDef | null {
  return PERKS.find((p) => p.id === id) ?? null;
}
