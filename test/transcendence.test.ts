import { describe, expect, it } from "vitest";
import { D, ZERO } from "../src/engine/decimal";
import { defaultState } from "../src/state/store";
import { canTranscend, divinityGain, transcend } from "../src/engine/transcendence";
import { TRANSCEND_MORTAL_SINS } from "../src/content/transcendence";

describe("transcendence", () => {
  it("is gated on Mortal Sin count", () => {
    const s = defaultState();
    expect(canTranscend(s)).toBe(false);
    s.mortalSins = TRANSCEND_MORTAL_SINS.sub(1);
    expect(canTranscend(s)).toBe(false);
    s.mortalSins = TRANSCEND_MORTAL_SINS;
    expect(canTranscend(s)).toBe(true);
  });

  it("gains floor(log10(sins + 1)) Divinity", () => {
    const s = defaultState();
    s.sins = ZERO;
    expect(divinityGain(s).eq(0)).toBe(true);
    s.sins = D(999); // log10(1000) = 3
    expect(divinityGain(s).eq(3)).toBe(true);
    s.sins = D("1e6"); // log10(1000001) ~= 6.0000004 -> floor 6
    expect(divinityGain(s).eq(6)).toBe(true);
  });

  it("wipes layers 1-3 but keeps perks/achievements/titles and banks Divinity", () => {
    const s = defaultState();
    s.mortalSins = TRANSCEND_MORTAL_SINS;
    s.sins = D(999);
    s.sinEssence = D("1e9");
    s.devourerRank = 5;
    s.gluttonyLevel = D(20);
    s.awakenings = D(4);
    s.greed = { form: 3, bloodCharge: D(50) };
    s.essenceUpgrades = { "gluttonys-might": 5 };
    s.autobuyers = { "auto-train": { unlocked: true, enabled: true, priority: 0 } };
    s.skills = { "wrath-ember": { level: 2, equipped: true } };
    s.appraisal = { "deep-sight": 3 };
    s.sinTree = { "restraint-1": true };
    s.sinTrials = { wrath: { unlocked: true, cleared: true } };
    s.perks = { "domain-power": true };
    s.achievements = { "first-digest": true };
    s.titles = { unlocked: ["mad-glutton"], active: "mad-glutton" };

    const gain = transcend(s);

    expect(gain.eq(3)).toBe(true);
    expect(s.divinity.eq(3)).toBe(true);
    expect(s.transcendences.eq(1)).toBe(true);
    // layers 1-3 wiped
    expect(s.sins.eq(0)).toBe(true);
    expect(s.mortalSins.eq(0)).toBe(true);
    expect(s.sinEssence.eq(0)).toBe(true);
    expect(s.devourerRank).toBe(0);
    expect(s.gluttonyLevel.eq(0)).toBe(true);
    expect(s.awakenings.eq(0)).toBe(true);
    expect(s.greed).toEqual({ form: 0, bloodCharge: ZERO });
    expect(s.essenceUpgrades).toEqual({});
    expect(s.autobuyers).toEqual({});
    expect(s.skills).toEqual({});
    expect(s.appraisal).toEqual({});
    expect(s.sinTree).toEqual({});
    expect(s.sinTrials).toEqual({});
    expect(s.activeTrial).toBe(null);
    expect(s.souls.eq(0)).toBe(true);
    // meta persists
    expect(s.perks).toEqual({ "domain-power": true });
    expect(s.achievements).toEqual({ "first-digest": true });
    expect(s.titles).toEqual({ unlocked: ["mad-glutton"], active: "mad-glutton" });
  });

  it("is a no-op below the threshold", () => {
    const s = defaultState();
    s.sins = D(999);
    const gain = transcend(s);
    expect(gain.eq(0)).toBe(true);
    expect(s.divinity.eq(0)).toBe(true);
    expect(s.sins.eq(999)).toBe(true);
  });
});
