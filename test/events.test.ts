import { afterEach, describe, expect, it } from "vitest";
import { GameEvent, _resetListeners, describeEvent, emit, subscribe } from "../src/engine/events";

afterEach(() => _resetListeners());

describe("event bus", () => {
  it("delivers emitted events to subscribers", () => {
    const seen: GameEvent[] = [];
    subscribe((e) => seen.push(e));
    emit({ type: "rank-up", rank: "S" });
    emit({ type: "prestige", layer: "transcend", gain: "3" });
    expect(seen).toEqual([
      { type: "rank-up", rank: "S" },
      { type: "prestige", layer: "transcend", gain: "3" },
    ]);
  });

  it("stops delivery after unsubscribe", () => {
    const seen: GameEvent[] = [];
    const unsub = subscribe((e) => seen.push(e));
    unsub();
    emit({ type: "title", name: "God" });
    expect(seen).toEqual([]);
  });
});

describe("describeEvent", () => {
  it("produces a tag and text for every variant", () => {
    const variants: GameEvent[] = [
      { type: "rank-up", rank: "S" },
      { type: "skill-gained", name: "Wrath Ember" },
      { type: "achievement", name: "God" },
      { type: "title", name: "Mad Glutton" },
      { type: "sin-skill", name: "Pride Crown" },
      { type: "prestige", layer: "frenzy", gain: "12" },
      { type: "prestige", layer: "digest" },
    ];
    for (const v of variants) {
      const out = describeEvent(v);
      expect(out.tag.length).toBeGreaterThan(0);
      expect(out.text.length).toBeGreaterThan(0);
    }
    expect(describeEvent({ type: "rank-up", rank: "S" }).text).toContain("S");
    expect(describeEvent({ type: "prestige", layer: "frenzy", gain: "12" }).text).toContain("12");
  });
});
