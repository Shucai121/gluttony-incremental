import { create } from "zustand";
import { Decimal, D, ZERO } from "../engine/decimal";
import { GameState, StatId, STAT_ORDER, StatState } from "./types";
import { spawnEnemy } from "../content/enemies";
import { HUNGER_MAX } from "../content/hunger";
import { INITIAL_STATS } from "../content/stats";

export const SAVE_VERSION = 2;

function emptyStats(): Record<StatId, StatState> {
  const stats = {} as Record<StatId, StatState>;
  for (const stat of STAT_ORDER) {
    stats[stat] = { value: D(INITIAL_STATS[stat]), trained: ZERO };
  }
  return stats;
}

export function defaultState(): GameState {
  return {
    version: SAVE_VERSION,
    lastSave: Date.now(),

    souls: ZERO,
    stats: emptyStats(),
    frenzyBought: ZERO,
    current: spawnEnemy(0, ZERO),
    totalKills: ZERO,

    hunger: 0,
    hungerMax: HUNGER_MAX,
    zone: 0,
    maxZone: 0,
    gluttonyLevel: ZERO,
    awakenings: ZERO,

    greed: { form: 0, bloodCharge: ZERO },

    sinEssence: ZERO,
    devourerRank: 0,
    essenceUpgrades: {},
    autobuyers: {},

    sinTrials: {},
    activeTrial: null,
    skills: {},
    appraisal: {},

    sins: ZERO,
    mortalSins: ZERO,
    sinTree: {},

    divinity: ZERO,
    transcendences: ZERO,
    perks: {},
    achievements: {},
    titles: { unlocked: [], active: null },

    settings: { notation: "scientific", offlineProgress: true, autosaveSec: 10 },
  };
}

/** Transform an older save forward one version at a time. */
export function migrate(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return {};
  const versioned = raw as { version?: number };
  if (typeof versioned.version === "number" && versioned.version > SAVE_VERSION) return {};
  let out: any = { ...raw };
  // 1 -> 2 (Phase 7): sins/mortalSins/sinTree already exist in defaultState, so
  // deepMerge fills any missing fields; this step only advances the version stamp.
  if (out.version === 1) out = { ...out, version: 2 };
  return out;
}

/** Deep-merge (revived) save over default so missing fields get defaults. */
export function deepMerge<T>(base: T, over: unknown): T {
  if (!over || typeof over !== "object") return base;
  const output: any = Array.isArray(base) ? [...base] : { ...(base as any) };
  for (const key of Object.keys(over)) {
    const value = (over as any)[key];
    const baseValue = (base as any)[key];
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      !(value instanceof Decimal) &&
      baseValue &&
      typeof baseValue === "object" &&
      !Array.isArray(baseValue)
    ) {
      output[key] = deepMerge(baseValue, value);
    } else {
      output[key] = value;
    }
  }
  return output;
}

/** Tiny store whose only job is to trigger React re-render each tick. */
export const useRender = create<{ frame: number; bump: () => void }>((set) => ({
  frame: 0,
  bump: () => set((state) => ({ frame: state.frame + 1 })),
}));
