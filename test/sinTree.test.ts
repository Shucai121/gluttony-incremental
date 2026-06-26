import { describe, expect, it } from "vitest";
import { D } from "../src/engine/decimal";
import { defaultState } from "../src/state/store";
import { sinTreeNodeById } from "../src/content/sinTree";
import {
  buyNode,
  canBuyNode,
  committedBranch,
  ownsNode,
  sinTreeMult,
} from "../src/engine/sinTree";
import { computeGlobalMult } from "../src/engine/combat";

describe("sin tree", () => {
  it("gates the first node on Sins and spends them", () => {
    const state = defaultState();
    const node = sinTreeNodeById("restraint-1")!;
    state.sins = node.cost.sub(1);
    expect(canBuyNode(state, "restraint-1")).toBe(false);
    state.sins = node.cost;
    expect(buyNode(state, "restraint-1")).toBe(true);
    expect(state.sins.eq(0)).toBe(true);
    expect(ownsNode(state, "restraint-1")).toBe(true);
  });

  it("requires the prerequisite node", () => {
    const state = defaultState();
    state.sins = D("1e9");
    expect(canBuyNode(state, "restraint-2")).toBe(false); // needs restraint-1
    buyNode(state, "restraint-1");
    expect(canBuyNode(state, "restraint-2")).toBe(true);
  });

  it("commits to one branch and forecloses the other", () => {
    const state = defaultState();
    state.sins = D("1e9");
    buyNode(state, "restraint-1");
    expect(committedBranch(state)).toBe("restraint");
    expect(canBuyNode(state, "indulgence-1")).toBe(false);
  });

  it("sinTreeMult reflects owned nodes and folds into the global mult", () => {
    const state = defaultState();
    state.sins = D("1e9");
    const before = computeGlobalMult(state);
    buyNode(state, "restraint-1");
    const node = sinTreeNodeById("restraint-1")!;
    expect(sinTreeMult(state).eq(node.mult)).toBe(true);
    expect(computeGlobalMult(state).eq(before.mul(node.mult))).toBe(true);
  });
});
