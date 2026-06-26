import { D, Decimal } from "../engine/decimal";

export type SkillEffectKind = "dps";

export interface SkillDef {
  id: string;
  name: string;
  description: string;
  kind: SkillEffectKind;
  multPerLevel: Decimal; // applied as multPerLevel ^ level while equipped
  dropZone: number; // zone whose enemies drop this skill; -1 = trial-only (undroppable)
}

// How many skills can be equipped at once.
export const LOADOUT_SIZE = 3;

export const SKILLS: SkillDef[] = [
  {
    id: "rending-claw",
    name: "Rending Claw",
    description: "Tear deeper with every strike. +15% damage per level.",
    kind: "dps",
    multPerLevel: D("1.15"),
    dropZone: 0,
  },
  {
    id: "venom-fang",
    name: "Venom Fang",
    description: "Lingering poison gnaws the foe. +12% damage per level.",
    kind: "dps",
    multPerLevel: D("1.12"),
    dropZone: 1,
  },
  {
    id: "soul-render",
    name: "Soul Render",
    description: "Shred the spirit alongside the flesh. +20% damage per level.",
    kind: "dps",
    multPerLevel: D("1.2"),
    dropZone: 2,
  },
  {
    id: "dread-howl",
    name: "Dread Howl",
    description: "Terror sharpens the kill. +25% damage per level.",
    kind: "dps",
    multPerLevel: D("1.25"),
    dropZone: 3,
  },
  // Sin Skills — granted only by clearing Sin Trials (never drop in normal combat).
  {
    id: "wrath-ember",
    name: "Wrath Ember",
    description: "Wrath's gift: fury made flame. +40% damage per level.",
    kind: "dps",
    multPerLevel: D("1.4"),
    dropZone: -1,
  },
  {
    id: "gluttons-maw",
    name: "Glutton's Maw",
    description: "Gluttony's gift: the endless hunger. +50% damage per level.",
    kind: "dps",
    multPerLevel: D("1.5"),
    dropZone: -1,
  },
];

export function skillById(id: string): SkillDef | null {
  return SKILLS.find((s) => s.id === id) ?? null;
}

export function skillDropForZone(zone: number): string | null {
  return SKILLS.find((s) => s.dropZone === zone)?.id ?? null;
}
