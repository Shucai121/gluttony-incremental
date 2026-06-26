import { D, Decimal } from "../engine/decimal";
import { GameState } from "../state/types";
import { MORTAL_SIN_RANK } from "./mortalSin";

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  mult: Decimal; // small permanent global multiplier once unlocked
  check: (state: GameState) => boolean;
}

// Achievements latch the first tick their condition holds (so transient milestones
// stick across resets) and grant a small permanent global multiplier.
export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "first-digest",
    name: "Mad Glutton",
    description: "Digest for the first time.",
    mult: D(1.1),
    check: (s) => s.gluttonyLevel.gte(1),
  },
  {
    id: "first-essence",
    name: "Taste of Sin",
    description: "Bank your first Sin Essence.",
    mult: D(1.15),
    check: (s) => s.sinEssence.gt(0),
  },
  {
    id: "rank-s",
    name: "Apex Devourer",
    description: "Reach Devourer Rank S.",
    mult: D(1.25),
    check: (s) => s.devourerRank >= MORTAL_SIN_RANK,
  },
  {
    id: "first-mortal-sin",
    name: "Heavenly Dragon Slayer",
    description: "Awaken as a Mortal Sin.",
    mult: D(1.5),
    check: (s) => s.mortalSins.gt(0),
  },
  {
    id: "first-transcend",
    name: "God",
    description: "Transcend into your own Domain.",
    mult: D(2),
    check: (s) => s.transcendences.gt(0),
  },
];

export function achievementById(id: string): AchievementDef | null {
  return ACHIEVEMENTS.find((a) => a.id === id) ?? null;
}
