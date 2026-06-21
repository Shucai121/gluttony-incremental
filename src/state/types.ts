import { Decimal } from "../engine/decimal";

export type StatId = "STR" | "VIT" | "AGI" | "DEX" | "MAG" | "MND";
export const STAT_ORDER: StatId[] = ["STR", "VIT", "AGI", "DEX", "MAG", "MND"];

export interface StatState {
  value: Decimal; // value = base + trained + absorbed
  trained: Decimal;
}

export interface EnemyState {
  hp: Decimal;
  maxHp: Decimal;
  soulValue: Decimal;
  tier: number;
  stats: Record<StatId, Decimal>;
  skillDropId: string | null;
}

export interface GameState {
  version: number;
  lastSave: number; // epoch ms

  // Phase 2 — combat & devour
  souls: Decimal;
  stats: Record<StatId, StatState>;
  frenzyBought: Decimal; // attack-speed buyable (tickspeed analog)
  current: EnemyState; // current enemy in the queue
  totalKills: Decimal;

  // Phase 3 — hunger, zones, in-run resets
  hunger: number; // 0..hungerMax (bounded)
  hungerMax: number;
  zone: number;
  maxZone: number;
  gluttonyLevel: Decimal; // Digest count (Boost analog)
  awakenings: Decimal; // Awaken Gluttony count (Galaxy analog)

  // Phase 4 — Greed
  greed: { form: number; bloodCharge: Decimal };

  // Phase 5 — Feeding Frenzy prestige
  sinEssence: Decimal;
  devourerRank: number; // index into RANKS
  essenceUpgrades: Record<string, number>;
  autobuyers: Record<string, { unlocked: boolean; enabled: boolean; priority: number }>;

  // Phase 6 — Sin Trials, Skills, Appraisal
  sinTrials: Record<string, { unlocked: boolean; cleared: boolean }>;
  activeTrial: string | null;
  skills: Record<string, { level: number; equipped: boolean }>;
  appraisal: Record<string, number>;

  // Phase 7 — Mortal Sin Awakening
  sins: Decimal;
  mortalSins: Decimal;
  sinTree: Record<string, boolean>;

  // Phase 8 — Transcendence (meta)
  divinity: Decimal;
  transcendences: Decimal;
  perks: Record<string, boolean>;
  achievements: Record<string, boolean>;
  titles: { unlocked: string[]; active: string | null };

  settings: {
    notation: "standard" | "scientific" | "engineering";
    offlineProgress: boolean;
    autosaveSec: number;
  };
}
