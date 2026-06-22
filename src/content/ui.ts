import { D, Decimal } from "../engine/decimal";

// Progressive-reveal thresholds (kills), tuned later. Single source for reveal numbers.
export const REVEAL: { trainingKills: Decimal; zoneKills: Decimal; gluttonyKills: Decimal } = {
  trainingKills: D(1),
  zoneKills: D(10),
  gluttonyKills: D(50),
};
