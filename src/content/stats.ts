import type { StatId } from "../state/types";

export const INITIAL_STATS: Record<StatId, string> = {
  STR: "1",
  VIT: "1",
  AGI: "0",
  DEX: "0",
  MAG: "0",
  MND: "0",
};

export const TRAINING_GAIN = "1";

export const TRAINING: Record<StatId, { trainBaseCost: string; trainCostMult: string }> = {
  STR: { trainBaseCost: "1e1", trainCostMult: "1.6" },
  MAG: { trainBaseCost: "1e1", trainCostMult: "1.65" },
  AGI: { trainBaseCost: "1e2", trainCostMult: "1.7" },
  DEX: { trainBaseCost: "1e2", trainCostMult: "1.7" },
  VIT: { trainBaseCost: "5e1", trainCostMult: "1.55" },
  MND: { trainBaseCost: "1e3", trainCostMult: "1.9" },
};
