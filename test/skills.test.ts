import { describe, expect, it } from "vitest";
import { D } from "../src/engine/decimal";
import { defaultState } from "../src/state/store";
import { LOADOUT_SIZE, skillById, skillDropForZone } from "../src/content/skills";
import {
  dropSkill,
  equipSkill,
  equippedCount,
  isEquipped,
  skillLevel,
  skillMult,
  unequipSkill,
} from "../src/engine/skills";

describe("skill content", () => {
  it("resolves skills by id and rolls a zone's drop", () => {
    const dropId = skillDropForZone(0);
    expect(dropId).not.toBeNull();
    expect(skillById(dropId!)).not.toBeNull();
  });

  it("returns null for a zone with no drop", () => {
    expect(skillDropForZone(999)).toBeNull();
  });
});

describe("skill engine", () => {
  it("first drop adds a skill at level 1 unequipped; re-drop levels it", () => {
    const state = defaultState();
    const id = skillDropForZone(0)!;
    dropSkill(state, id);
    expect(skillLevel(state, id)).toBe(1);
    expect(isEquipped(state, id)).toBe(false);
    dropSkill(state, id);
    expect(skillLevel(state, id)).toBe(2);
  });

  it("equipping respects the loadout size and ownership", () => {
    const state = defaultState();
    // cannot equip an unowned skill
    const id0 = skillDropForZone(0)!;
    expect(equipSkill(state, id0)).toBe(false);

    // own and equip up to the cap
    const owned: string[] = [];
    for (let z = 0; owned.length < LOADOUT_SIZE + 1; z++) {
      const id = skillDropForZone(z);
      if (id) {
        dropSkill(state, id);
        owned.push(id);
      }
    }
    for (let i = 0; i < LOADOUT_SIZE; i++) {
      expect(equipSkill(state, owned[i])).toBe(true);
    }
    expect(equippedCount(state)).toBe(LOADOUT_SIZE);
    // loadout full -> next equip fails
    expect(equipSkill(state, owned[LOADOUT_SIZE])).toBe(false);
    // unequip frees a slot
    unequipSkill(state, owned[0]);
    expect(equipSkill(state, owned[LOADOUT_SIZE])).toBe(true);
  });

  it("skillMult reflects only equipped skills", () => {
    const state = defaultState();
    const id = skillDropForZone(0)!;
    dropSkill(state, id);
    expect(skillMult(state).eq(1)).toBe(true); // owned but not equipped
    equipSkill(state, id);
    const def = skillById(id)!;
    expect(skillMult(state).eq(def.multPerLevel.pow(skillLevel(state, id)))).toBe(true);
  });
});
