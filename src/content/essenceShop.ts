import { D, Decimal } from "../engine/decimal";

export type EssenceEffectKind = "global" | "absorption";

export interface EssenceUpgrade {
  id: string;
  name: string;
  description: string;
  baseCost: Decimal; // Sin Essence cost of the first level
  costMult: Decimal; // geometric cost growth per owned level
  maxLevel: number | null; // null = unbounded
  kind: EssenceEffectKind;
  multPerLevel: Decimal; // contributes multPerLevel^level to its kind's product
}

export const ESSENCE_UPGRADES: EssenceUpgrade[] = [
  {
    id: "gluttonys-might",
    name: "Gluttony's Might",
    description: "Every devoured soul strikes harder. +50% global damage per level.",
    baseCost: D(5),
    costMult: D(4),
    maxLevel: null,
    kind: "global",
    multPerLevel: D("1.5"),
  },
  {
    id: "deep-absorption",
    name: "Deep Absorption",
    description: "Tear more stats from each kill. +25% absorption per level.",
    baseCost: D(10),
    costMult: D(5),
    maxLevel: null,
    kind: "absorption",
    multPerLevel: D("1.25"),
  },
];

export function essenceUpgradeById(id: string): EssenceUpgrade | null {
  return ESSENCE_UPGRADES.find((u) => u.id === id) ?? null;
}
