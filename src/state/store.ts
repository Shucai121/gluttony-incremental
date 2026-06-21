import { create } from "zustand";
import { Decimal, ZERO } from "../engine/decimal";
import { GameState, StatId, STAT_ORDER, StatState } from "./types";
import { spawnEnemy } from "../content/enemies";

export const SAVE_VERSION = 1;

function emptyStats(): Record<StatId, StatState> {
  const o = {} as Record<StatId, StatState>;
  for (const s of STAT_ORDER) o[s] = { value: ZERO, trained: ZERO };
  return o;
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
    hungerMax: 100,
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
export function migrate(raw: any): any {
  if (!raw || typeof raw !== "object") return {};
  if (typeof raw.version === "number" && raw.version > SAVE_VERSION) return {}; // newer save -> fall back
  // Future: switch on raw.version and apply step-by-step upgrades here.
  return raw;
}

/** Deep-merge a (revived) save over a fresh default so missing fields get defaults. */
export function deepMerge<T>(base: T, over: any): T {
  if (over === null || over === undefined) return base;
  if (base instanceof Decimal) return (over instanceof Decimal ? over : base) as T;
  if (Array.isArray(base)) return (Array.isArray(over) ? over : base) as T;
  if (typeof base === "object") {
    const out: any = { ...(base as any) };
    for (const k in over) {
      out[k] = k in (base as any) ? deepMerge((base as any)[k], over[k]) : over[k];
    }
    return out as T;
  }
  return (over ?? base) as T;
}

/** Tiny store whose only job is to trigger a React re-render each tick. */
export const useRender = create<{ frame: number; bump: () => void }>((set) => ({
  frame: 0,
  bump: () => set((s) => ({ frame: s.frame + 1 })),
}));
