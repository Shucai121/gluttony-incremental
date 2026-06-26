import { GameState } from "../state/types";
import { MORTAL_SIN_RANK } from "./mortalSin";

export interface TitleDef {
  id: string;
  name: string;
  description: string;
  check: (state: GameState) => boolean;
}

// Titles are cosmetic (NOT part of the global multiplier per SPEC §6) — a Berserk-of-
// Gluttony flavour ladder the player unlocks and can set as their active title.
export const TITLES: TitleDef[] = [
  {
    id: "mad-glutton",
    name: "Mad Glutton",
    description: "The hunger took hold.",
    check: (s) => s.gluttonyLevel.gte(1),
  },
  {
    id: "heavenly-dragon-slayer",
    name: "Heavenly Dragon Slayer",
    description: "Apex of the Devourer ranks.",
    check: (s) => s.devourerRank >= MORTAL_SIN_RANK,
  },
  {
    id: "god",
    name: "God",
    description: "You hold dominion over your own Domain.",
    check: (s) => s.transcendences.gt(0),
  },
];

export function titleById(id: string): TitleDef | null {
  return TITLES.find((t) => t.id === id) ?? null;
}
