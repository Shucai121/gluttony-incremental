import { describe, it, expect } from "vitest";
import { defaultState } from "../src/state/store";
import { D } from "../src/engine/decimal";
import { nextObjective } from "../src/ui/nudge";

describe("nextObjective", () => {
  it("tells a brand-new player to let hunger devour the foe", () => {
    const s = defaultState();
    expect(nextObjective(s)).toContain("devour the foe");
  });

  it("tells a player with souls and no training to spend", () => {
    const s = defaultState();
    s.totalKills = D(1);
    s.souls = D(5);
    expect(nextObjective(s)).toContain("Spend Souls");
  });

  it("returns null once all tracked objectives are met", () => {
    const s = defaultState();
    s.totalKills = D(60);
    s.souls = D(5);
    s.stats.STR.trained = D(1);
    s.maxZone = 2;
    s.gluttonyLevel = D(1);
    expect(nextObjective(s)).toBeNull();
  });
});
