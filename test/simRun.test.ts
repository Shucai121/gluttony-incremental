import { describe, expect, it } from "vitest";
import { defaultState } from "../src/state/store";
import { AUTOBUYERS } from "../src/content/autobuyers";
import { stepEngine } from "../src/engine/step";
import { canFeedingFrenzy, feedingFrenzy } from "../src/engine/reset";

// End-to-end: a mid-game player (autobuyers unlocked) left to idle should, purely from the
// engine loop, climb through the prestige layers. We run up to 50k logical ticks at the live
// 50ms cadence and break out once progression is demonstrated.
describe("idle sim advances through prestige layers", () => {
  it("auto-digests and banks Feeding Frenzies over a long unattended run", () => {
    const s = defaultState();
    for (const def of AUTOBUYERS) {
      s.autobuyers[def.id] = { unlocked: true, enabled: true, priority: def.defaultPriority };
    }

    let everDigested = false;
    let frenzies = 0;
    const TICKS = 50000;
    for (let i = 0; i < TICKS; i++) {
      stepEngine(s, 0.05);
      if (s.gluttonyLevel.gt(0)) everDigested = true;
      // Let the run mature into its first Digest before banking a Frenzy — a sensible
      // player wouldn't reset an empty run. This also keeps the sim's numbers small enough
      // to stay fast (we break out long before stats explode).
      if (everDigested && canFeedingFrenzy(s)) {
        feedingFrenzy(s);
        frenzies += 1;
      }
      if (everDigested && frenzies >= 2) break; // loop proven; stop early to stay fast
    }

    expect(everDigested).toBe(true); // Digest prestige (layer 1) fired
    expect(frenzies).toBeGreaterThanOrEqual(1); // Feeding Frenzy (layer 1.5) fired
    expect(s.sinEssence.gt(0) || s.devourerRank > 0).toBe(true); // the frenzy paid out
  });
});
