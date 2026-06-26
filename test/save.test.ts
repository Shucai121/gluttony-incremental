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

describe("save migration v1 -> v2 (Phase 7)", () => {
  it("loads a hand-written version-1 save under the current version without loss", () => {
    const v1 = {
      version: 1,
      devourerRank: 4,
      essenceUpgrades: { "gluttonys-might": 3 },
    };
    const migrated = migrate(v1) as { version: number };
    expect(migrated.version).toBe(2);

    const loaded = deepMerge(defaultState(), migrated);
    expect(loaded.version).toBe(2);
    expect(loaded.devourerRank).toBe(4);
    expect(loaded.essenceUpgrades["gluttonys-might"]).toBe(3);
    // Phase 7 fields absent from the v1 save get their defaults
    expect(loaded.sins.eq(0)).toBe(true);
    expect(loaded.mortalSins.eq(0)).toBe(true);
    expect(loaded.sinTree).toEqual({});
  });
});
