import { D, Decimal } from "../engine/decimal";
import type { Modifiers } from "../engine/modifiers";

export interface SinDef {
  id: string;
  name: string;
  description: string;
  constraint: Partial<Modifiers>; // the lever active for the duration of the trial
  constraintText: string; // player-facing summary of the constraint
  clearKills: Decimal; // kills-in-trial required to clear
  rewardSkillId: string;
}

// 7 Deadly Sins, each a distinct constraint. clearKills are deliberately modest
// (Phase 10 balance pass tunes these); rewards are trial-only Sin Skills.
export const SINS: SinDef[] = [
  {
    id: "wrath",
    name: "Wrath",
    description: "Rage burns away your restraint — Hunger consumes you twice as fast.",
    constraint: { hungerRateMult: 2 },
    constraintText: "Hunger rises 2× faster",
    clearKills: D(40),
    rewardSkillId: "wrath-ember",
  },
  {
    id: "sloth",
    name: "Sloth",
    description: "Lethargy dulls your edge — every strike lands at half force.",
    constraint: { dpsMult: D("0.5") },
    constraintText: "Damage halved",
    clearKills: D(40),
    rewardSkillId: "sloth-shroud",
  },
  {
    id: "lust",
    name: "Lust",
    description: "Craving distracts the devour — you absorb only half as much.",
    constraint: { absorbMult: D("0.5") },
    constraintText: "Absorption halved",
    clearKills: D(40),
    rewardSkillId: "lust-charm",
  },
  {
    id: "pride",
    name: "Pride",
    description: "Too proud to draw the sword — Greed is locked to its current form.",
    constraint: { greedLocked: true },
    constraintText: "Greed forms locked",
    clearKills: D(40),
    rewardSkillId: "pride-crown",
  },
  {
    id: "envy",
    name: "Envy",
    description: "You covet others' strength but cannot earn your own — Training is forbidden.",
    constraint: { trainingLocked: true },
    constraintText: "Training disabled",
    clearKills: D(40),
    rewardSkillId: "envy-mirror",
  },
  {
    id: "greed",
    name: "Greed",
    description: "Blind avarice — your Appraisal is sealed for the duration.",
    constraint: { appraisalLocked: true },
    constraintText: "Appraisal disabled",
    clearKills: D(40),
    rewardSkillId: "greed-edge",
  },
  {
    id: "gluttony",
    name: "Gluttony",
    description: "The cursed skill turns on you — Hunger races and damage falters.",
    constraint: { hungerRateMult: 2, dpsMult: D("0.75") },
    constraintText: "Hunger 2× faster, damage ×0.75",
    clearKills: D(60),
    rewardSkillId: "gluttons-maw",
  },
];

export function sinById(id: string): SinDef | null {
  return SINS.find((s) => s.id === id) ?? null;
}
