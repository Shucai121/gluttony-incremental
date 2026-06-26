import { afterEach, describe, expect, it } from "vitest";
import { D } from "../src/engine/decimal";
import { defaultState } from "../src/state/store";
import { GameEvent, _resetListeners, subscribe } from "../src/engine/events";
import { digest, feedingFrenzy } from "../src/engine/reset";
import { transcend } from "../src/engine/transcendence";
import { dropSkill } from "../src/engine/skills";
import { enterTrial, checkTrialClear } from "../src/engine/sinTrial";
import { TRANSCEND_MORTAL_SINS } from "../src/content/transcendence";
import { SINS } from "../src/content/sins";

afterEach(() => _resetListeners());

function capture(): GameEvent[] {
  const seen: GameEvent[] = [];
  subscribe((e) => seen.push(e));
  return seen;
}

describe("engine event emissions", () => {
  it("emits a digest prestige event", () => {
    const s = defaultState();
    s.totalKills = D("1e9"); // satisfy canDigest
    const seen = capture();
    digest(s);
    expect(seen).toContainEqual({ type: "prestige", layer: "digest" });
  });

  it("emits a frenzy prestige event with a gain", () => {
    const s = defaultState();
    s.hunger = s.hungerMax;
    s.souls = D("1e40");
    const seen = capture();
    feedingFrenzy(s);
    const frenzy = seen.find((e) => e.type === "prestige" && e.layer === "frenzy");
    expect(frenzy).toBeTruthy();
    expect((frenzy as { gain: string }).gain.length).toBeGreaterThan(0);
  });

  it("emits a transcend prestige event", () => {
    const s = defaultState();
    s.mortalSins = TRANSCEND_MORTAL_SINS;
    s.sins = D(999);
    const seen = capture();
    transcend(s);
    expect(seen).toContainEqual({ type: "prestige", layer: "transcend", gain: "3" });
  });

  it("emits skill-gained only on first acquisition", () => {
    const s = defaultState();
    const seen = capture();
    dropSkill(s, "rending-claw"); // new -> emits
    dropSkill(s, "rending-claw"); // level up -> silent
    const gains = seen.filter((e) => e.type === "skill-gained");
    expect(gains).toHaveLength(1);
    expect((gains[0] as { name: string }).name).toBe("Rending Claw");
  });

  it("emits a sin-skill event (not skill-gained) when a trial clears", () => {
    const s = defaultState();
    const sin = SINS[0];
    enterTrial(s, sin.id);
    s.totalKills = sin.clearKills; // meet clear condition
    const seen = capture();
    checkTrialClear(s);
    expect(seen.some((e) => e.type === "sin-skill")).toBe(true);
    expect(seen.some((e) => e.type === "skill-gained")).toBe(false);
  });
});
