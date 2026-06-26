import { describe, expect, it } from "vitest";
import { D } from "../src/engine/decimal";
import { encode, decode } from "../src/engine/save";
import { defaultState, deepMerge, migrate } from "../src/state/store";

describe("save round-trip for Phase 5 prestige fields", () => {
  it("preserves sinEssence, rank, essence upgrades, and autobuyers", () => {
    const state = defaultState();
    state.sinEssence = D("1.234e9");
    state.devourerRank = 3;
    state.essenceUpgrades = { "gluttonys-might": 5, "deep-absorption": 2 };
    state.autobuyers = {
      "auto-train": { unlocked: true, enabled: false, priority: 0 },
      "auto-dive": { unlocked: true, enabled: true, priority: 1 },
    };

    const roundTripped = deepMerge(defaultState(), migrate(decode(JSON.parse(JSON.stringify(encode(state))))));

    expect(roundTripped.sinEssence.eq("1.234e9")).toBe(true);
    expect(roundTripped.devourerRank).toBe(3);
    expect(roundTripped.essenceUpgrades["gluttonys-might"]).toBe(5);
    expect(roundTripped.essenceUpgrades["deep-absorption"]).toBe(2);
    expect(roundTripped.autobuyers["auto-train"].unlocked).toBe(true);
    expect(roundTripped.autobuyers["auto-train"].enabled).toBe(false);
    expect(roundTripped.autobuyers["auto-dive"].priority).toBe(1);
  });
});
