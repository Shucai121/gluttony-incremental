import { D, Decimal } from "../engine/decimal";

export interface AutobuyerDef {
  id: string;
  name: string;
  description: string;
  unlockCost: Decimal; // one-time Sin Essence cost
  defaultPriority: number; // lower runs first
}

export const AUTOBUYERS: AutobuyerDef[] = [
  {
    id: "auto-train",
    name: "Instinct: Train",
    description: "Greed trains your stats with every spare soul.",
    unlockCost: D(3),
    defaultPriority: 0,
  },
  {
    id: "auto-dive",
    name: "Instinct: Dive",
    description: "Descends to the next zone the instant it is safe.",
    unlockCost: D(8),
    defaultPriority: 1,
  },
  {
    id: "auto-digest",
    name: "Instinct: Digest",
    description: "Digests automatically once the threshold is met.",
    unlockCost: D(25),
    defaultPriority: 2,
  },
];

export function autobuyerById(id: string): AutobuyerDef | null {
  return AUTOBUYERS.find((a) => a.id === id) ?? null;
}
