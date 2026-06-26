import { describe, expect, it } from "vitest";
import { D } from "../src/engine/decimal";
import { defaultState } from "../src/state/store";
import { OFFLINE_CAP_SEC, applyOfflineProgress } from "../src/engine/offline";

describe("offline progress", () => {
  it("fast-forwards combat while away", () => {
    const s = defaultState();
    s.stats.STR.value = D(20); // enough DPS to make progress
    const applied = applyOfflineProgress(s, 120); // 2 minutes
    expect(applied).toBe(120);
    expect(s.totalKills.gt(0)).toBe(true);
  });

  it("caps very long absences (and stays bounded/fast)", () => {
    const s = defaultState();
    s.stats.STR.value = D(20);
    const applied = applyOfflineProgress(s, OFFLINE_CAP_SEC * 100);
    expect(applied).toBe(OFFLINE_CAP_SEC);
    expect(s.totalKills.gt(0)).toBe(true);
  });

  it("is a no-op when offline progress is disabled", () => {
    const s = defaultState();
    s.stats.STR.value = D(50);
    s.settings.offlineProgress = false;
    const applied = applyOfflineProgress(s, 600);
    expect(applied).toBe(0);
    expect(s.totalKills.eq(0)).toBe(true);
  });

  it("is a no-op for non-positive elapsed time", () => {
    const s = defaultState();
    expect(applyOfflineProgress(s, 0)).toBe(0);
    expect(applyOfflineProgress(s, -100)).toBe(0);
  });
});
