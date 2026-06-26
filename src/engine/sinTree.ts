import { SIN_TREE, SinBranch, sinTreeNodeById } from "../content/sinTree";
import { GameState } from "../state/types";
import { Decimal, ONE } from "./decimal";

export function ownsNode(state: GameState, id: string): boolean {
  return state.sinTree[id] === true;
}

/** The branch the player has committed to (first owned node's branch), or null. */
export function committedBranch(state: GameState): SinBranch | null {
  for (const node of SIN_TREE) {
    if (ownsNode(state, node.id)) return node.branch;
  }
  return null;
}

export function canBuyNode(state: GameState, id: string): boolean {
  const node = sinTreeNodeById(id);
  if (!node) return false;
  if (ownsNode(state, id)) return false;
  const branch = committedBranch(state);
  if (branch !== null && branch !== node.branch) return false; // other branch foreclosed
  if (node.requires !== null && !ownsNode(state, node.requires)) return false;
  return state.sins.gte(node.cost);
}

export function buyNode(state: GameState, id: string): boolean {
  if (!canBuyNode(state, id)) return false;
  const node = sinTreeNodeById(id)!;
  state.sins = state.sins.sub(node.cost);
  state.sinTree[id] = true;
  return true;
}

/** Product of every owned node's multiplier (folds into computeGlobalMult). */
export function sinTreeMult(state: GameState): Decimal {
  let mult = ONE;
  for (const node of SIN_TREE) {
    if (ownsNode(state, node.id)) mult = mult.mul(node.mult);
  }
  return mult;
}
