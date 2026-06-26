import { describe, expect, it } from "vitest";
import { D } from "../src/engine/decimal";
import { defaultState } from "../src/state/store";
import { buyPerk, canBuyPerk, ownsPerk, perkMult } from "../src/engine/perks";

describe("domain perks", () => {
  it("gates purchase on Divinity", () => {
    const s = defaultState();
    expect(canBuyPerk(s, "domain-power")).toBe(false);
    s.divinity = D(1);
    expect(canBuyPerk(s, "domain-power")).toBe(true);
  });

  it("buy deducts Divinity and latches ownership", () => {
    const s = defaultState();
    s.divinity = D(5);
    expect(buyPerk(s, "domain-power")).toBe(true);
    expect(ownsPerk(s, "domain-power")).toBe(true);
    expect(s.divinity.eq(4)).toBe(true);
  });

  it("cannot rebuy an owned perk", () => {
    const s = defaultState();
    s.divinity = D(5);
    buyPerk(s, "domain-power");
    expect(canBuyPerk(s, "domain-power")).toBe(false);
    expect(buyPerk(s, "domain-power")).toBe(false);
  });

  it("perkMult folds the product of owned perks", () => {
    const s = defaultState();
    expect(perkMult(s).eq(1)).toBe(true);
    s.divinity = D(100);
    buyPerk(s, "domain-power"); // x5
    buyPerk(s, "domain-greed"); // x10
    expect(perkMult(s).eq(50)).toBe(true);
  });
});
