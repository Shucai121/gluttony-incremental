import { D, Decimal } from "../engine/decimal";

export type SinBranch = "restraint" | "indulgence";

export interface SinTreeNode {
  id: string;
  name: string;
  description: string;
  branch: SinBranch;
  cost: Decimal; // in Sins
  requires: string | null; // prerequisite node id within the same branch
  mult: Decimal; // global multiplier while owned
}

// Two mutually-exclusive branches — the "other voice" inside Gluttony forces a build.
export const SIN_TREE: SinTreeNode[] = [
  {
    id: "restraint-1",
    name: "Restraint I",
    description: "Master the hunger. ×3 to all gains.",
    branch: "restraint",
    cost: D(1),
    requires: null,
    mult: D(3),
  },
  {
    id: "restraint-2",
    name: "Restraint II",
    description: "Discipline compounds. ×5 to all gains.",
    branch: "restraint",
    cost: D(8),
    requires: "restraint-1",
    mult: D(5),
  },
  {
    id: "indulgence-1",
    name: "Indulgence I",
    description: "Feed the hunger. ×3 to all gains.",
    branch: "indulgence",
    cost: D(1),
    requires: null,
    mult: D(3),
  },
  {
    id: "indulgence-2",
    name: "Indulgence II",
    description: "Gorge without limit. ×5 to all gains.",
    branch: "indulgence",
    cost: D(8),
    requires: "indulgence-1",
    mult: D(5),
  },
];

export function sinTreeNodeById(id: string): SinTreeNode | null {
  return SIN_TREE.find((n) => n.id === id) ?? null;
}
