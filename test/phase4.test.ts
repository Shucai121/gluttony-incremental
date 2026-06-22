import { describe, expect, it } from "vitest";
import { GREED_BURST, GREED_FORMS } from "../src/content/greed";
import { D } from "../src/engine/decimal";
import { computeDps } from "../src/engine/combat";
import { decode, encode } from "../src/engine/save";
import { advanceForm, canAdvanceForm, greedMult, triggerBloodBurst, tickGreed } from "../src/engine/greed";
import { defaultState, deepMerge, migrate } from "../src/state/store";

describe("phase 4 greed", () => {
  it("folds Greed form multiplier into computeDps", () => {
    const baseline = defaultState();
    const withScythe = defaultState();
    withScythe.greed.form = 1;

    expect(greedMult(withScythe).eq(GREED_FORMS[1].damageMult)).toBe(true);
    expect(computeDps(withScythe).eq(computeDps(baseline).mul(GREED_FORMS[1].damageMult))).toBe(true);
  });

  it("advances form by spending souls and stat blood cost", () => {
    const state = defaultState();
    state.souls = D("1e6");
    state.stats.STR.value = D(100);
    state.stats.VIT.value = D(100);

    const dpsBefore = computeDps(state);
    const soulsBefore = state.souls;
    const strBefore = state.stats.STR.value;
    const vitBefore = state.stats.VIT.value;
    const next = GREED_FORMS[1];

    expect(canAdvanceForm(state)).toBe(true);
    expect(advanceForm(state)).toBe(true);

    expect(state.greed.form).toBe(1);
    expect(state.souls.eq(soulsBefore.sub(next.unlockCost.souls))).toBe(true);
    expect(state.stats.STR.value.eq(strBefore.sub(next.unlockCost.stats.STR))).toBe(true);
    expect(state.stats.VIT.value.eq(vitBefore.sub(next.unlockCost.stats.VIT))).toBe(true);
    expect(computeDps(state).gt(dpsBefore)).toBe(true);
  });

  it("refuses blood costs that would drive stats negative", () => {
    const state = defaultState();
    state.souls = D("1e6");
    state.stats.STR.value = D("0.5");
    state.stats.VIT.value = D("0.5");

    expect(canAdvanceForm(state)).toBe(false);
    expect(advanceForm(state)).toBe(false);
    expect(state.greed.form).toBe(0);
    expect(state.stats.STR.value.eq("0.5")).toBe(true);
    expect(state.stats.VIT.value.eq("0.5")).toBe(true);
  });

  it("blood burst spends VIT, boosts DPS, and expires", () => {
    const state = defaultState();
    state.stats.VIT.value = D(100);
    const dpsBefore = computeDps(state);

    expect(triggerBloodBurst(state)).toBe(true);
    expect(state.stats.VIT.value.eq(D(100).sub(GREED_BURST.vitCost))).toBe(true);
    expect(state.greed.bloodCharge.eq(GREED_BURST.durationSec)).toBe(true);
    expect(computeDps(state).eq(dpsBefore.mul(GREED_BURST.damageMult))).toBe(true);

    tickGreed(state, GREED_BURST.durationSec.toNumber());

    expect(state.greed.bloodCharge.eq(0)).toBe(true);
    expect(computeDps(state).eq(dpsBefore)).toBe(true);
  });

  it("save load preserves Greed form and blood charge as Decimal", () => {
    const state = defaultState();
    state.greed.form = 2;
    state.greed.bloodCharge = D("7.5");

    const wire = JSON.parse(JSON.stringify(encode(state)));
    const loaded = deepMerge(defaultState(), migrate(decode(wire)));

    expect(loaded.greed.form).toBe(2);
    expect(loaded.greed.bloodCharge.eq("7.5")).toBe(true);
  });
});
