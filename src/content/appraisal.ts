import { D, Decimal } from "../engine/decimal";

export type AppraisalKind = "depth" | "reveal";

export interface AppraisalNode {
  id: string;
  name: string;
  description: string;
  kind: AppraisalKind;
  baseCost: Decimal; // in Sin Essence
  costMult: Decimal;
  maxLevel: number | null;
}

// Zones 0..(APPRAISAL_FREE_ZONES - 1) are always reachable; deeper prey needs Deep Sight.
export const APPRAISAL_FREE_ZONES = 5;
export const APPRAISAL_ZONES_PER_LEVEL = 3;

export const APPRAISAL: AppraisalNode[] = [
  {
    id: "deep-sight",
    name: "Deep Sight",
    description: "Pierce the gloom of deeper zones, unlocking stronger prey.",
    kind: "depth",
    baseCost: D(25),
    costMult: D(4),
    maxLevel: null,
  },
  {
    id: "predator-eye",
    name: "Predator's Eye",
    description: "Appraise a foe's stats and drops before the kill.",
    kind: "reveal",
    baseCost: D(10),
    costMult: D(3),
    maxLevel: 1,
  },
];

export function appraisalNodeById(id: string): AppraisalNode | null {
  return APPRAISAL.find((n) => n.id === id) ?? null;
}
