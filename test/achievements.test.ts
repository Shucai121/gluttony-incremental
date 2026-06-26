import { describe, expect, it } from "vitest";
import { D } from "../src/engine/decimal";
import { defaultState } from "../src/state/store";
import { achievementMult, checkAchievements, isUnlocked } from "../src/engine/achievements";
import { checkTitles, setTitle, titleUnlocked } from "../src/engine/titles";

describe("achievements", () => {
  it("latches when its condition first holds and stays latched", () => {
    const s = defaultState();
    expect(checkAchievements(s)).toEqual([]);
    s.gluttonyLevel = D(1);
    expect(checkAchievements(s)).toContain("first-digest");
    expect(isUnlocked(s, "first-digest")).toBe(true);
    // condition reverts (e.g. after a reset) but the achievement stays
    s.gluttonyLevel = D(0);
    expect(checkAchievements(s)).toEqual([]);
    expect(isUnlocked(s, "first-digest")).toBe(true);
  });

  it("folds unlocked multipliers into achievementMult", () => {
    const s = defaultState();
    expect(achievementMult(s).eq(1)).toBe(true);
    s.gluttonyLevel = D(1); // first-digest x1.1
    s.mortalSins = D(1); // first-mortal-sin x1.5
    checkAchievements(s);
    expect(achievementMult(s).eq(D(1.1).mul(1.5))).toBe(true);
  });
});

describe("titles", () => {
  it("latches unlocked titles and lets you set an unlocked one active", () => {
    const s = defaultState();
    checkTitles(s);
    expect(s.titles.unlocked).toEqual([]);
    s.gluttonyLevel = D(1);
    expect(checkTitles(s)).toContain("mad-glutton");
    expect(titleUnlocked(s, "mad-glutton")).toBe(true);
    expect(setTitle(s, "mad-glutton")).toBe(true);
    expect(s.titles.active).toBe("mad-glutton");
  });

  it("refuses to set a locked title active", () => {
    const s = defaultState();
    expect(setTitle(s, "god")).toBe(false);
    expect(s.titles.active).toBe(null);
  });
});
