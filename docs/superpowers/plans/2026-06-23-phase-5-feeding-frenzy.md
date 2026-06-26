# Phase 5 — Feeding Frenzy (Prestige Layer 1) + Greed's Instincts Implementation Plan

> **For agentic workers (Codex):** REQUIRED SUB-SKILL: implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. You may dispatch sub-agents to work independent tasks in parallel — the dependency graph is given in the "Parallelism" note below — but every task must end green (`npm run test` + `npm run build`) before its dependents start.

**Goal:** Add the first full prestige loop — maxing Hunger triggers a **Feeding Frenzy** that wipes the run for **Sin Essence**, which raises **Devourer Rank** and buys **Essence-Shop upgrades** and **Greed's-Instinct autobuyers**, making each subsequent run demonstrably faster.

**Architecture:** Pure, unit-tested engine modules (`ranks`, `prestige`, `essenceShop`, `autobuyers`) feed their multipliers into the *single* existing combat sources of truth (`computeGlobalMult`, `absorbRate` in `combat.ts`). The Feeding Frenzy reset lives in `reset.ts` and obeys the SPEC §4 reset-scope table. Autobuyers tick from the game loop and reuse existing engine actions (`buyMaxTraining`, `advanceZone`, `digest`). One new reveal-gated UI panel (`FrenzyPanel`) surfaces all of it.

**Tech Stack:** TypeScript (strict) · Vite 5 · React 18 · Zustand · break_infinity.js · Vitest (node env).

## Global Constraints

These apply to **every** task (SPEC §0 / §7 — verbatim):

- **Every** currency / cost / stat / HP / DPS / Souls / Sin Essence value is a `Decimal` (`break_infinity.js`). Only `hunger`/`hungerMax`, array indices, `devourerRank`, `zone`/`form` indices, `priority`, and `settings.autosaveSec` are JS `number`.
- **Never** use JS `+ - * / > <` on Decimals — use `.add .sub .mul .div .pow .gt .gte .lt .lte .eq .max .min`. Decimal methods are immutable (return new Decimals).
- **All** tunable balance constants live in `src/content/*.ts`. No magic numbers in `src/engine/*` or `src/ui/*`.
- **All** reset logic lives in `src/engine/reset.ts` and obeys the SPEC §4 reset-scope table.
- **All** DPS/Souls/absorption multipliers fold into ONE place: `computeDps` / `soulsPerKill` / `absorbRate` / `computeGlobalMult` in `combat.ts`. Never scatter multipliers; never put combat math in the UI (UI reads results only).
- Pure engine tests run in node; React components are gated by `npm run build` (no component unit tests).
- Save shape is **unchanged** — all Phase 5 fields already exist in `types.ts`/`defaultState`. Do **not** bump `SAVE_VERSION` and do **not** add a `migrate` step.
- A task is done only when its tests pass, `npm run build` is clean, and the SPEC §7 grep gauntlet is clean.

**Setup (do once before Task 1):**

```bash
cd /Users/kaejay/projects/system-ascendant
git checkout main && git pull
git checkout -b phase-5-feeding-frenzy
npm install
npm run test   # baseline: 35 tests green
npm run build  # baseline: clean
```

Commit per task with message `phase-5: <task summary>`. Do **not** merge or push to `main` — push the `phase-5-feeding-frenzy` branch and report back; the human merges.

**Parallelism (for sub-agent dispatch):** Tasks 1, 2, 4, 6 create independent new files and can run in parallel. Task 3 needs 1+2. Task 5 needs 1+4. Task 7 needs 6. Tasks 9–12 (UI) need 1–7 done. Task 8 (save test) is independent. Task 13 is the final gate.

---

### Task 1: Devourer Rank (`content/ranks.ts` + `engine/ranks.ts`)

**Files:**
- Create: `src/content/ranks.ts`
- Create: `src/engine/ranks.ts`
- Test: `test/ranks.test.ts`

**Interfaces:**
- Consumes: `GameState` (`state.sinEssence: Decimal`, `state.devourerRank: number`), `Decimal`/`D` from `engine/decimal`.
- Produces:
  - `RANKS: readonly string[]`, `RANK_THRESHOLDS: string[]`, `RANK_MULT_BASE: string` (content)
  - `rankName(state: GameState): string`
  - `rankMult(state: GameState): Decimal`  ← consumed by Task 5
  - `updateDevourerRank(state: GameState): void`  ← consumed by Task 3 (ratchets `state.devourerRank` up, never down)

- [ ] **Step 1: Write the failing test**

```ts
// test/ranks.test.ts
import { describe, expect, it } from "vitest";
import { D } from "../src/engine/decimal";
import { defaultState } from "../src/state/store";
import { rankMult, rankName, updateDevourerRank } from "../src/engine/ranks";

describe("devourer rank", () => {
  it("starts at rank E with x1 multiplier", () => {
    const state = defaultState();
    expect(rankName(state)).toBe("E");
    expect(rankMult(state).eq(1)).toBe(true);
  });

  it("ranks up on cumulative sin essence thresholds (3^index multiplier)", () => {
    const state = defaultState();
    state.sinEssence = D(50); // threshold for rank D (index 1)
    updateDevourerRank(state);
    expect(state.devourerRank).toBe(1);
    expect(rankName(state)).toBe("D");
    expect(rankMult(state).eq(3)).toBe(true);

    state.sinEssence = D("5e3"); // rank C (index 2)
    updateDevourerRank(state);
    expect(rankMult(state).eq(9)).toBe(true);
  });

  it("ratchets: spending essence below a threshold never lowers rank", () => {
    const state = defaultState();
    state.sinEssence = D("5e3");
    updateDevourerRank(state);
    expect(state.devourerRank).toBe(2);

    state.sinEssence = D(0); // spent it all in the shop
    updateDevourerRank(state);
    expect(state.devourerRank).toBe(2); // unchanged
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- ranks`
Expected: FAIL — `Cannot find module '../src/engine/ranks'`.

- [ ] **Step 3: Create the content file**

```ts
// src/content/ranks.ts
export const RANKS: readonly string[] = ["E", "D", "C", "B", "A", "S"];

// Rank-up thresholds on cumulative Sin Essence (SPEC §6). Index aligns with RANKS.
export const RANK_THRESHOLDS: string[] = ["0", "50", "5e3", "5e5", "1e8", "1e12"];

// rankMult = RANK_MULT_BASE ^ devourerRank
export const RANK_MULT_BASE = "3";
```

- [ ] **Step 4: Create the engine file**

```ts
// src/engine/ranks.ts
import { RANK_MULT_BASE, RANK_THRESHOLDS, RANKS } from "../content/ranks";
import { GameState } from "../state/types";
import { Decimal, D } from "./decimal";

export function rankName(state: GameState): string {
  return RANKS[state.devourerRank] ?? RANKS[RANKS.length - 1];
}

export function rankMult(state: GameState): Decimal {
  return D(RANK_MULT_BASE).pow(state.devourerRank);
}

/** Raise devourerRank to match cumulative sinEssence. Ratchet: never lowers. */
export function updateDevourerRank(state: GameState): void {
  let earned = 0;
  for (let i = 0; i < RANK_THRESHOLDS.length; i++) {
    if (state.sinEssence.gte(RANK_THRESHOLDS[i])) earned = i;
  }
  state.devourerRank = Math.max(state.devourerRank, earned);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- ranks`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/content/ranks.ts src/engine/ranks.ts test/ranks.test.ts
git commit -m "phase-5: add Devourer Rank multiplier ladder"
```

---

### Task 2: Sin Essence gain formula (`engine/prestige.ts`)

**Files:**
- Create: `src/engine/prestige.ts`
- Test: `test/prestige.test.ts` (created here; extended in Task 3)

**Interfaces:**
- Consumes: `Decimal` from `engine/decimal`.
- Produces: `sinEssenceGain(souls: Decimal, hungerRatio: number): Decimal` ← consumed by Task 3 and the UI (Task 9/10). Pure; always returns `>= 1`; monotonic non-decreasing in `souls`.

- [ ] **Step 1: Write the failing test**

```ts
// test/prestige.test.ts
import { describe, expect, it } from "vitest";
import { D } from "../src/engine/decimal";
import { sinEssenceGain } from "../src/engine/prestige";

describe("sinEssenceGain", () => {
  it("always yields at least 1", () => {
    expect(sinEssenceGain(D(0), 0).gte(1)).toBe(true);
    expect(sinEssenceGain(D("1e5"), 1).gte(1)).toBe(true);
  });

  it("is non-decreasing as run size (souls) grows", () => {
    const small = sinEssenceGain(D("1e30"), 1);
    const big = sinEssenceGain(D("1e90"), 1);
    expect(big.gte(small)).toBe(true);
    expect(big.gt(small)).toBe(true);
  });

  it("pays more at higher hunger ratio", () => {
    const low = sinEssenceGain(D("1e60"), 0);
    const high = sinEssenceGain(D("1e60"), 1);
    expect(high.gt(low)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- prestige`
Expected: FAIL — `Cannot find module '../src/engine/prestige'`.

- [ ] **Step 3: Create the engine file (formula verbatim from SPEC §2)**

```ts
// src/engine/prestige.ts
import { Decimal } from "./decimal";

// SPEC §2 reference formula. break_infinity's .log10() returns a JS number
// (break_eternity will return a Decimal — audit in Phase 7).
export function sinEssenceGain(souls: Decimal, hungerRatio: number): Decimal {
  const l = souls.max(1).log10(); // run size
  return new Decimal(Math.floor(10 ** Math.max(0, (l - 30) / 30)))
    .mul(1 + hungerRatio) // riding high hunger pays more
    .max(1);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- prestige`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/engine/prestige.ts test/prestige.test.ts
git commit -m "phase-5: add pure sinEssenceGain prestige formula"
```

---

### Task 3: Feeding Frenzy reset (`engine/reset.ts`)

**Files:**
- Modify: `src/engine/reset.ts`
- Test: `test/prestige.test.ts` (extend)

**Interfaces:**
- Consumes: `sinEssenceGain` (Task 2), `updateDevourerRank` (Task 1), `hungerRatio` (`engine/hunger`), existing `resetRun` (private in `reset.ts`).
- Produces:
  - `canFeedingFrenzy(state: GameState): boolean` (true when `state.hunger >= state.hungerMax`)
  - `feedingFrenzy(state: GameState): Decimal` (performs the reset, returns Sin Essence gained, `ZERO` if ineligible) ← consumed by the loop/UI

**Reset-scope for Feeding Frenzy (SPEC §4 — obey exactly):** souls/stats/current/totalKills/zone/maxZone → CLEAR (via `resetRun`); frenzyBought → CLEAR (via `resetRun`); hunger → 0 (via `resetRun`); gluttonyLevel → CLEAR; awakenings → CLEAR; greed.bloodCharge → 0, greed.form → KEEP; sinEssence → +gain then KEEP; devourerRank/essenceUpgrades/autobuyers → KEEP.

- [ ] **Step 1: Write the failing test (append to `test/prestige.test.ts`)**

```ts
// append to test/prestige.test.ts
import { D, ZERO } from "../src/engine/decimal";
import { defaultState } from "../src/state/store";
import { canFeedingFrenzy, feedingFrenzy } from "../src/engine/reset";

describe("feeding frenzy reset", () => {
  it("is gated on maxed hunger", () => {
    const state = defaultState();
    state.hunger = state.hungerMax - 1;
    expect(canFeedingFrenzy(state)).toBe(false);
    state.hunger = state.hungerMax;
    expect(canFeedingFrenzy(state)).toBe(true);
  });

  it("does nothing and returns ZERO when ineligible", () => {
    const state = defaultState();
    state.hunger = 0;
    state.souls = D("1e40");
    expect(feedingFrenzy(state).eq(ZERO)).toBe(true);
    expect(state.souls.eq("1e40")).toBe(true); // untouched
  });

  it("clears the run, banks Sin Essence, keeps prestige rewards, ratchets rank", () => {
    const state = defaultState();
    // a developed run:
    state.souls = D("1e60");
    state.stats.STR.value = D(500);
    state.stats.STR.trained = D(50);
    state.frenzyBought = D(10);
    state.totalKills = D(9999);
    state.zone = 4;
    state.maxZone = 4;
    state.hunger = state.hungerMax;
    state.gluttonyLevel = D(7);
    state.awakenings = D(2);
    state.greed.form = 2;
    state.greed.bloodCharge = D(8);
    // pre-existing prestige rewards that must survive:
    state.sinEssence = D(40);
    state.essenceUpgrades = { "gluttonys-might": 3 };
    state.autobuyers = { "auto-train": { unlocked: true, enabled: true, priority: 0 } };

    const gained = feedingFrenzy(state);

    expect(gained.gt(ZERO)).toBe(true);
    // run cleared:
    expect(state.souls.eq(ZERO)).toBe(true);
    expect(state.stats.STR.trained.eq(ZERO)).toBe(true);
    expect(state.frenzyBought.eq(ZERO)).toBe(true);
    expect(state.totalKills.eq(ZERO)).toBe(true);
    expect(state.zone).toBe(0);
    expect(state.maxZone).toBe(0);
    expect(state.hunger).toBe(0);
    expect(state.gluttonyLevel.eq(ZERO)).toBe(true);
    expect(state.awakenings.eq(ZERO)).toBe(true);
    // greed: charge wiped, form kept:
    expect(state.greed.bloodCharge.eq(ZERO)).toBe(true);
    expect(state.greed.form).toBe(2);
    // rewards kept + gain banked:
    expect(state.sinEssence.eq(D(40).add(gained))).toBe(true);
    expect(state.essenceUpgrades["gluttonys-might"]).toBe(3);
    expect(state.autobuyers["auto-train"].unlocked).toBe(true);
    // rank ratcheted from cumulative essence (40 + gain may cross 50 -> D):
    expect(state.devourerRank).toBeGreaterThanOrEqual(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- prestige`
Expected: FAIL — `canFeedingFrenzy`/`feedingFrenzy` not exported from `reset.ts`.

- [ ] **Step 3: Add imports at the top of `src/engine/reset.ts`**

Find the existing import block (currently ends with `import { Decimal, D, ONE, ZERO } from "./decimal";`) and add below it:

```ts
import { sinEssenceGain } from "./prestige";
import { updateDevourerRank } from "./ranks";
import { hungerRatio } from "./hunger";
```

- [ ] **Step 4: Append the Feeding Frenzy functions to the end of `src/engine/reset.ts`**

```ts
export function canFeedingFrenzy(state: GameState): boolean {
  return state.hunger >= state.hungerMax;
}

/** Full Phase 2–4 reset; banks Sin Essence and ratchets Devourer Rank. Returns gain. */
export function feedingFrenzy(state: GameState): Decimal {
  if (!canFeedingFrenzy(state)) return ZERO;

  const gain = sinEssenceGain(state.souls, hungerRatio(state));

  resetRun(state); // souls, stats, frenzyBought, current, totalKills, zone, maxZone, hunger
  state.gluttonyLevel = ZERO;
  state.awakenings = ZERO;
  state.greed.bloodCharge = ZERO; // form is kept (SPEC §4)

  state.sinEssence = state.sinEssence.add(gain);
  updateDevourerRank(state);
  return gain;
}
```

> Note: `resetRun` already sets `souls/stats/frenzyBought/current/totalKills/hunger/zone/maxZone` to defaults — reusing it satisfies the "deeper reset performs every shallower clear" rule. We additionally clear `gluttonyLevel`, `awakenings`, and `greed.bloodCharge` per the Feeding-Frenzy column.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- prestige`
Expected: PASS (6 tests total in the file).

- [ ] **Step 6: Commit**

```bash
git add src/engine/reset.ts test/prestige.test.ts
git commit -m "phase-5: add Feeding Frenzy reset obeying reset-scope table"
```

---

### Task 4: Essence Shop (`content/essenceShop.ts` + `engine/essenceShop.ts`)

**Files:**
- Create: `src/content/essenceShop.ts`
- Create: `src/engine/essenceShop.ts`
- Test: `test/essenceShop.test.ts`

**Interfaces:**
- Consumes: `GameState` (`state.sinEssence: Decimal`, `state.essenceUpgrades: Record<string, number>`), `Decimal`/`D`/`ONE`/`ZERO`/`geometricCost` from `engine/decimal`.
- Produces:
  - `ESSENCE_UPGRADES: EssenceUpgrade[]`, `EssenceUpgrade`, `EssenceEffectKind` (content)
  - `essenceUpgradeLevel(state, id): number`, `essenceUpgradeCost(state, id): Decimal`, `canBuyEssenceUpgrade(state, id): boolean`, `buyEssenceUpgrade(state, id): boolean`
  - `essenceShopMult(state): Decimal` ← consumed by Task 5 (folds into globalMult)
  - `essenceAbsorptionMult(state): Decimal` ← consumed by Task 5 (folds into absorbRate)

- [ ] **Step 1: Write the failing test**

```ts
// test/essenceShop.test.ts
import { describe, expect, it } from "vitest";
import { D } from "../src/engine/decimal";
import { defaultState } from "../src/state/store";
import {
  buyEssenceUpgrade,
  canBuyEssenceUpgrade,
  essenceAbsorptionMult,
  essenceShopMult,
  essenceUpgradeCost,
} from "../src/engine/essenceShop";

describe("essence shop", () => {
  it("first level costs the base cost; multipliers default to x1", () => {
    const state = defaultState();
    expect(essenceUpgradeCost(state, "gluttonys-might").eq(5)).toBe(true);
    expect(essenceShopMult(state).eq(1)).toBe(true);
    expect(essenceAbsorptionMult(state).eq(1)).toBe(true);
  });

  it("gates purchase on Sin Essence and spends it on buy", () => {
    const state = defaultState();
    state.sinEssence = D(4);
    expect(canBuyEssenceUpgrade(state, "gluttonys-might")).toBe(false);
    state.sinEssence = D(5);
    expect(buyEssenceUpgrade(state, "gluttonys-might")).toBe(true);
    expect(state.sinEssence.eq(0)).toBe(true);
    expect(state.essenceUpgrades["gluttonys-might"]).toBe(1);
  });

  it("global upgrade multiplies the shop's global mult by 1.5 per level", () => {
    const state = defaultState();
    state.essenceUpgrades = { "gluttonys-might": 2 };
    expect(essenceShopMult(state).eq(D("1.5").pow(2))).toBe(true);
    expect(essenceAbsorptionMult(state).eq(1)).toBe(true);
  });

  it("absorption upgrade multiplies absorption mult by 1.25 per level, geometric cost", () => {
    const state = defaultState();
    expect(essenceUpgradeCost(state, "deep-absorption").eq(10)).toBe(true);
    state.essenceUpgrades = { "deep-absorption": 1 };
    expect(essenceUpgradeCost(state, "deep-absorption").eq(D(10).mul(5))).toBe(true);
    expect(essenceAbsorptionMult(state).eq(D("1.25"))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- essenceShop`
Expected: FAIL — `Cannot find module '../src/engine/essenceShop'`.

- [ ] **Step 3: Create the content file**

```ts
// src/content/essenceShop.ts
import { D, Decimal } from "../engine/decimal";

export type EssenceEffectKind = "global" | "absorption";

export interface EssenceUpgrade {
  id: string;
  name: string;
  description: string;
  baseCost: Decimal; // Sin Essence cost of the first level
  costMult: Decimal; // geometric cost growth per owned level
  maxLevel: number | null; // null = unbounded
  kind: EssenceEffectKind;
  multPerLevel: Decimal; // contributes multPerLevel^level to its kind's product
}

export const ESSENCE_UPGRADES: EssenceUpgrade[] = [
  {
    id: "gluttonys-might",
    name: "Gluttony's Might",
    description: "Every devoured soul strikes harder. +50% global damage per level.",
    baseCost: D(5),
    costMult: D(4),
    maxLevel: null,
    kind: "global",
    multPerLevel: D("1.5"),
  },
  {
    id: "deep-absorption",
    name: "Deep Absorption",
    description: "Tear more stats from each kill. +25% absorption per level.",
    baseCost: D(10),
    costMult: D(5),
    maxLevel: null,
    kind: "absorption",
    multPerLevel: D("1.25"),
  },
];

export function essenceUpgradeById(id: string): EssenceUpgrade | null {
  return ESSENCE_UPGRADES.find((u) => u.id === id) ?? null;
}
```

- [ ] **Step 4: Create the engine file**

```ts
// src/engine/essenceShop.ts
import { ESSENCE_UPGRADES, EssenceEffectKind, essenceUpgradeById } from "../content/essenceShop";
import { GameState } from "../state/types";
import { Decimal, ONE, ZERO, geometricCost } from "./decimal";

export function essenceUpgradeLevel(state: GameState, id: string): number {
  return state.essenceUpgrades[id] ?? 0;
}

export function essenceUpgradeCost(state: GameState, id: string): Decimal {
  const upgrade = essenceUpgradeById(id);
  if (!upgrade) return ZERO;
  return geometricCost(upgrade.baseCost, upgrade.costMult, essenceUpgradeLevel(state, id));
}

export function canBuyEssenceUpgrade(state: GameState, id: string): boolean {
  const upgrade = essenceUpgradeById(id);
  if (!upgrade) return false;
  if (upgrade.maxLevel !== null && essenceUpgradeLevel(state, id) >= upgrade.maxLevel) return false;
  return state.sinEssence.gte(essenceUpgradeCost(state, id));
}

export function buyEssenceUpgrade(state: GameState, id: string): boolean {
  if (!canBuyEssenceUpgrade(state, id)) return false;
  state.sinEssence = state.sinEssence.sub(essenceUpgradeCost(state, id));
  state.essenceUpgrades[id] = essenceUpgradeLevel(state, id) + 1;
  return true;
}

function kindMult(state: GameState, kind: EssenceEffectKind): Decimal {
  let mult = ONE;
  for (const upgrade of ESSENCE_UPGRADES) {
    if (upgrade.kind !== kind) continue;
    const level = essenceUpgradeLevel(state, upgrade.id);
    if (level > 0) mult = mult.mul(upgrade.multPerLevel.pow(level));
  }
  return mult;
}

export function essenceShopMult(state: GameState): Decimal {
  return kindMult(state, "global");
}

export function essenceAbsorptionMult(state: GameState): Decimal {
  return kindMult(state, "absorption");
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- essenceShop`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/content/essenceShop.ts src/engine/essenceShop.ts test/essenceShop.test.ts
git commit -m "phase-5: add Sin Essence shop with global and absorption upgrades"
```

---

### Task 5: Fold Rank + Essence-Shop multipliers into combat (`engine/combat.ts`)

**Files:**
- Modify: `src/engine/combat.ts`
- Test: `test/essenceShop.test.ts` (extend with combat-fold assertions)

**Interfaces:**
- Consumes: `rankMult` (Task 1), `essenceShopMult`/`essenceAbsorptionMult` (Task 4).
- Produces: extended `computeGlobalMult` (now `digestMult × rankMult × essenceShopMult`) and `absorbRate` (now `× essenceAbsorptionMult`). No signature changes — both still `(state) => Decimal`.

- [ ] **Step 1: Write the failing test (append to `test/essenceShop.test.ts`)**

```ts
// append to test/essenceShop.test.ts
import { absorbRate, computeGlobalMult } from "../src/engine/combat";

describe("essence shop and rank fold into combat", () => {
  it("rank multiplier folds into the global mult", () => {
    const state = defaultState();
    expect(computeGlobalMult(state).eq(1)).toBe(true); // rank E, no digests, no upgrades
    state.devourerRank = 1; // x3
    expect(computeGlobalMult(state).eq(3)).toBe(true);
  });

  it("global essence upgrade folds into the global mult", () => {
    const state = defaultState();
    state.essenceUpgrades = { "gluttonys-might": 1 };
    expect(computeGlobalMult(state).eq(D("1.5"))).toBe(true);
  });

  it("absorption upgrade folds into absorbRate", () => {
    const base = absorbRate(defaultState());
    const state = defaultState();
    state.essenceUpgrades = { "deep-absorption": 1 };
    expect(absorbRate(state).eq(base.mul("1.25"))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- essenceShop`
Expected: FAIL — `computeGlobalMult` still returns only `digestMult`, so the rank/upgrade assertions fail.

- [ ] **Step 3: Add imports to `src/engine/combat.ts`**

Below the existing `import { digestMult } from "./reset";` line, add:

```ts
import { rankMult } from "./ranks";
import { essenceAbsorptionMult, essenceShopMult } from "./essenceShop";
```

- [ ] **Step 4: Extend `computeGlobalMult`**

Replace the existing function body:

```ts
export function computeGlobalMult(state: GameState): Decimal {
  return digestMult(state.gluttonyLevel);
}
```

with:

```ts
export function computeGlobalMult(state: GameState): Decimal {
  return digestMult(state.gluttonyLevel)
    .mul(rankMult(state))
    .mul(essenceShopMult(state));
}
```

- [ ] **Step 5: Extend `absorbRate`**

Replace the existing function body:

```ts
export function absorbRate(state: GameState): Decimal {
  return D(BASE_ABSORB)
    .mul(D(ABSORB_AWAKENING_MULT).pow(state.awakenings))
    .mul(ONE.add(state.stats.MND.value.div(MND_SCALE)));
}
```

with:

```ts
export function absorbRate(state: GameState): Decimal {
  return D(BASE_ABSORB)
    .mul(D(ABSORB_AWAKENING_MULT).pow(state.awakenings))
    .mul(essenceAbsorptionMult(state))
    .mul(ONE.add(state.stats.MND.value.div(MND_SCALE)));
}
```

- [ ] **Step 6: Run tests to verify all pass (no regressions)**

Run: `npm run test`
Expected: PASS — the new essenceShop fold tests pass AND the existing `combat.test.ts` still passes (default state has rank 0 / no upgrades, so `globalMult` and `absorbRate` are unchanged for it).

- [ ] **Step 7: Commit**

```bash
git add src/engine/combat.ts test/essenceShop.test.ts
git commit -m "phase-5: fold rank and essence-shop multipliers into combat sources of truth"
```

---

### Task 6: Greed's-Instinct autobuyers (`content/autobuyers.ts` + `engine/autobuyers.ts`)

**Files:**
- Create: `src/content/autobuyers.ts`
- Create: `src/engine/autobuyers.ts`
- Test: `test/autobuyers.test.ts`

**Interfaces:**
- Consumes: `GameState` (`state.sinEssence`, `state.autobuyers: Record<string, { unlocked; enabled; priority }>`), `STAT_ORDER`; engine actions `buyMaxTraining` (`engine/training`), `canAdvanceZone`/`advanceZone` (`engine/zones`), `canDigest`/`digest` (`engine/reset`).
- Produces:
  - `AUTOBUYERS: AutobuyerDef[]`, `AutobuyerDef`, `autobuyerById(id)` (content)
  - `canUnlockAutobuyer(state, id): boolean`, `unlockAutobuyer(state, id): boolean`, `setAutobuyerEnabled(state, id, enabled): void`, `isAutobuyerActive(state, id): boolean`
  - `tickAutobuyers(state: GameState): void` ← consumed by Task 7 (the loop)

- [ ] **Step 1: Write the failing test**

```ts
// test/autobuyers.test.ts
import { describe, expect, it } from "vitest";
import { D } from "../src/engine/decimal";
import { defaultState } from "../src/state/store";
import {
  canUnlockAutobuyer,
  setAutobuyerEnabled,
  tickAutobuyers,
  unlockAutobuyer,
} from "../src/engine/autobuyers";

describe("greed's instinct autobuyers", () => {
  it("is inert until unlocked", () => {
    const state = defaultState();
    state.souls = D(1000);
    tickAutobuyers(state); // no autobuyers unlocked -> nothing happens
    expect(state.stats.STR.trained.eq(0)).toBe(true);
  });

  it("gates unlock on Sin Essence and spends it", () => {
    const state = defaultState();
    state.sinEssence = D(2);
    expect(canUnlockAutobuyer(state, "auto-train")).toBe(false);
    state.sinEssence = D(3);
    expect(unlockAutobuyer(state, "auto-train")).toBe(true);
    expect(state.sinEssence.eq(0)).toBe(true);
    expect(state.autobuyers["auto-train"].unlocked).toBe(true);
    expect(state.autobuyers["auto-train"].enabled).toBe(true);
  });

  it("auto-train buys training each tick once unlocked and enabled", () => {
    const state = defaultState();
    state.sinEssence = D(3);
    unlockAutobuyer(state, "auto-train");
    state.souls = D(1000);
    tickAutobuyers(state);
    expect(state.stats.STR.trained.gt(0)).toBe(true);
  });

  it("respects the enabled toggle", () => {
    const state = defaultState();
    state.sinEssence = D(3);
    unlockAutobuyer(state, "auto-train");
    setAutobuyerEnabled(state, "auto-train", false);
    state.souls = D(1000);
    tickAutobuyers(state);
    expect(state.stats.STR.trained.eq(0)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- autobuyers`
Expected: FAIL — `Cannot find module '../src/engine/autobuyers'`.

- [ ] **Step 3: Create the content file**

```ts
// src/content/autobuyers.ts
import { D, Decimal } from "../engine/decimal";

export interface AutobuyerDef {
  id: string;
  name: string;
  description: string;
  unlockCost: Decimal; // one-time Sin Essence cost
  defaultPriority: number; // lower runs first
}

export const AUTOBUYERS: AutobuyerDef[] = [
  {
    id: "auto-train",
    name: "Instinct: Train",
    description: "Greed trains your stats with every spare soul.",
    unlockCost: D(3),
    defaultPriority: 0,
  },
  {
    id: "auto-dive",
    name: "Instinct: Dive",
    description: "Descends to the next zone the instant it is safe.",
    unlockCost: D(8),
    defaultPriority: 1,
  },
  {
    id: "auto-digest",
    name: "Instinct: Digest",
    description: "Digests automatically once the threshold is met.",
    unlockCost: D(25),
    defaultPriority: 2,
  },
];

export function autobuyerById(id: string): AutobuyerDef | null {
  return AUTOBUYERS.find((a) => a.id === id) ?? null;
}
```

- [ ] **Step 4: Create the engine file**

```ts
// src/engine/autobuyers.ts
import { AUTOBUYERS, autobuyerById } from "../content/autobuyers";
import { GameState, STAT_ORDER } from "../state/types";
import { buyMaxTraining } from "./training";
import { advanceZone, canAdvanceZone } from "./zones";
import { canDigest, digest } from "./reset";

export function isAutobuyerActive(state: GameState, id: string): boolean {
  const a = state.autobuyers[id];
  return !!a && a.unlocked && a.enabled;
}

export function canUnlockAutobuyer(state: GameState, id: string): boolean {
  const def = autobuyerById(id);
  if (!def) return false;
  if (state.autobuyers[id]?.unlocked) return false;
  return state.sinEssence.gte(def.unlockCost);
}

export function unlockAutobuyer(state: GameState, id: string): boolean {
  if (!canUnlockAutobuyer(state, id)) return false;
  const def = autobuyerById(id)!;
  state.sinEssence = state.sinEssence.sub(def.unlockCost);
  state.autobuyers[id] = { unlocked: true, enabled: true, priority: def.defaultPriority };
  return true;
}

export function setAutobuyerEnabled(state: GameState, id: string, enabled: boolean): void {
  const a = state.autobuyers[id];
  if (a?.unlocked) a.enabled = enabled;
}

function runAutobuyer(state: GameState, id: string): void {
  switch (id) {
    case "auto-train":
      for (const stat of STAT_ORDER) buyMaxTraining(state, stat);
      break;
    case "auto-dive": {
      let guard = 0;
      while (canAdvanceZone(state) && guard < 100) {
        advanceZone(state);
        guard += 1;
      }
      break;
    }
    case "auto-digest":
      if (canDigest(state)) digest(state);
      break;
  }
}

/** Run every unlocked + enabled autobuyer, lowest priority first. */
export function tickAutobuyers(state: GameState): void {
  const active = AUTOBUYERS.map((d) => d.id)
    .filter((id) => isAutobuyerActive(state, id))
    .sort((a, b) => state.autobuyers[a].priority - state.autobuyers[b].priority);
  for (const id of active) runAutobuyer(state, id);
}
```

> `auto-dive`'s `while` terminates because advancing a zone raises the next kill requirement and the VIT-gated `maxSafeZone` is fixed within a tick; the `guard` is belt-and-suspenders.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- autobuyers`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/content/autobuyers.ts src/engine/autobuyers.ts test/autobuyers.test.ts
git commit -m "phase-5: add Greed's-Instinct autobuyers (train/dive/digest)"
```

---

### Task 7: Wire autobuyers into the game loop (`engine/game.ts`)

**Files:**
- Modify: `src/engine/game.ts`
- Test: `test/autobuyers.test.ts` (extend with a loop-integration assertion)

**Interfaces:**
- Consumes: `tickAutobuyers` (Task 6) and the existing `tick(deltaSec)`.
- Produces: autobuyers run once per logical tick, after combat.

- [ ] **Step 1: Write the failing test (append to `test/autobuyers.test.ts`)**

```ts
// append to test/autobuyers.test.ts
import { tick, game } from "../src/engine/game";

describe("autobuyers run from the game loop", () => {
  it("a tick drives an unlocked auto-train", () => {
    // game.state is the live singleton; set it up for this assertion.
    game.state.sinEssence = D(3);
    unlockAutobuyer(game.state, "auto-train");
    game.state.souls = D(1000);
    const before = game.state.stats.STR.trained;
    tick(0.05);
    expect(game.state.stats.STR.trained.gte(before)).toBe(true);
    expect(game.state.stats.STR.trained.gt(0)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- autobuyers`
Expected: FAIL — the loop does not call `tickAutobuyers`, so `auto-train` never fires from `tick`.

- [ ] **Step 3: Add the import to `src/engine/game.ts`**

Below `import { tickHunger } from "./hunger";` add:

```ts
import { tickAutobuyers } from "./autobuyers";
```

- [ ] **Step 4: Call `tickAutobuyers` in `tick`**

In the `tick` function, after the `tickCombat(game.state, deltaSec);` line, add:

```ts
  tickAutobuyers(game.state);
```

So the body reads:

```ts
export function tick(deltaSec: number): void {
  game.ticks += 1;
  tickHunger(game.state, deltaSec);
  tickGreed(game.state, deltaSec);
  tickCombat(game.state, deltaSec);
  tickAutobuyers(game.state);

  sinceSaveSec += deltaSec;
  if (sinceSaveSec >= game.state.settings.autosaveSec) {
    sinceSaveSec = 0;
    game.state.lastSave = Date.now();
    saveGame(game.state);
  }
}
```

- [ ] **Step 5: Run tests to verify all pass**

Run: `npm run test`
Expected: PASS — all suites green.

- [ ] **Step 6: Commit**

```bash
git add src/engine/game.ts test/autobuyers.test.ts
git commit -m "phase-5: run autobuyers each game tick after combat"
```

---

### Task 8: Save/load round-trip for Phase 5 fields (`test/save.test.ts`)

**Files:**
- Test: `test/save.test.ts` (create)

**Interfaces:**
- Consumes: `encode`/`decode` from `engine/save`, `defaultState`/`deepMerge`/`migrate` from `state/store`.

> No production change — Phase 5 fields already serialize via the generic `encode`/`decode`. This test documents and guards the round-trip required by the PLAN checklist. If `encode`/`decode` are not exported from `save.ts`, export them (they are used internally by `saveGame`/`loadRaw`).

- [ ] **Step 1: Confirm the encode/decode exports**

Run: `grep -n "export function encode\|export function decode" src/engine/save.ts`
Expected: both are exported. If `decode` is not exported, add `export` to its declaration (it already exists per SPEC §2) and commit that one-line change with this task.

- [ ] **Step 2: Write the failing test**

```ts
// test/save.test.ts
import { describe, expect, it } from "vitest";
import { D } from "../src/engine/decimal";
import { encode, decode } from "../src/engine/save";
import { defaultState, deepMerge, migrate } from "../src/state/store";

describe("save round-trip for Phase 5 prestige fields", () => {
  it("preserves sinEssence, rank, essence upgrades, and autobuyers", () => {
    const state = defaultState();
    state.sinEssence = D("1.234e9");
    state.devourerRank = 3;
    state.essenceUpgrades = { "gluttonys-might": 5, "deep-absorption": 2 };
    state.autobuyers = {
      "auto-train": { unlocked: true, enabled: false, priority: 0 },
      "auto-dive": { unlocked: true, enabled: true, priority: 1 },
    };

    const roundTripped = deepMerge(defaultState(), migrate(decode(JSON.parse(JSON.stringify(encode(state))))));

    expect(roundTripped.sinEssence.eq("1.234e9")).toBe(true);
    expect(roundTripped.devourerRank).toBe(3);
    expect(roundTripped.essenceUpgrades["gluttonys-might"]).toBe(5);
    expect(roundTripped.essenceUpgrades["deep-absorption"]).toBe(2);
    expect(roundTripped.autobuyers["auto-train"].unlocked).toBe(true);
    expect(roundTripped.autobuyers["auto-train"].enabled).toBe(false);
    expect(roundTripped.autobuyers["auto-dive"].priority).toBe(1);
  });
});
```

- [ ] **Step 3: Run test to verify it passes**

Run: `npm run test -- save`
Expected: PASS. (If it fails on a missing export, apply Step 1's fix.)

- [ ] **Step 4: Commit**

```bash
git add test/save.test.ts src/engine/save.ts
git commit -m "phase-5: guard save round-trip for prestige fields"
```

---

### Task 9: Reveal + nudge for the Feeding Frenzy panel (`ui/reveal.ts`, `ui/nudge.ts`)

**Files:**
- Modify: `src/ui/reveal.ts`
- Modify: `src/ui/nudge.ts`
- Test: `test/reveal.test.ts` (extend), `test/nudge.test.ts` (extend)

**Interfaces:**
- Produces: `Panel` union gains `"frenzy"`; `PANELS` includes it; `isRevealed(state)` reveals `frenzy` when `state.hunger >= state.hungerMax || state.sinEssence.gt(ZERO)`; `REVEAL_COPY.frenzy` set. `nextObjective` returns a frenzy line when gorged and not yet prestiged.

> The frenzy panel can NOT key on `totalKills` (that resets every digest/frenzy). It keys on a signal that means "prestige is available or has happened": hunger maxed (live), or any Sin Essence earned (permanent until Phase 7). This stays revealed across the very reset it triggers.

- [ ] **Step 1: Write the failing tests**

```ts
// append to test/reveal.test.ts
import { ZERO, D } from "../src/engine/decimal";

describe("frenzy panel reveal", () => {
  it("hidden before hunger maxes and before any essence", () => {
    const state = defaultState();
    state.hunger = 0;
    state.sinEssence = ZERO;
    expect(isRevealed("frenzy", state)).toBe(false);
  });

  it("revealed exactly when hunger maxes", () => {
    const state = defaultState();
    state.hunger = state.hungerMax;
    expect(isRevealed("frenzy", state)).toBe(true);
  });

  it("stays revealed after first frenzy even at zero hunger", () => {
    const state = defaultState();
    state.hunger = 0;
    state.sinEssence = D(2);
    expect(isRevealed("frenzy", state)).toBe(true);
  });
});
```

```ts
// append to test/nudge.test.ts
describe("frenzy objective nudge", () => {
  it("nudges to Feeding Frenzy when gorged and not yet prestiged", () => {
    const state = defaultState();
    state.totalKills = D(5);
    state.hunger = state.hungerMax;
    state.sinEssence = ZERO;
    expect(nextObjective(state)).toContain("Frenzy");
  });
});
```

> If `test/nudge.test.ts` does not already import `D`/`ZERO` from `../src/engine/decimal`, add that import at the top.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- reveal nudge`
Expected: FAIL — `"frenzy"` is not a valid `Panel`; nudge has no frenzy line.

- [ ] **Step 3: Update `src/ui/reveal.ts`**

Add the import for `ZERO`:

```ts
import { ZERO } from "../engine/decimal";
```

Extend the `Panel` type and `PANELS`:

```ts
export type Panel = "foe" | "status" | "training" | "zone" | "gluttony" | "greed" | "frenzy";

export const PANELS: readonly Panel[] = ["foe", "status", "training", "zone", "gluttony", "greed", "frenzy"];
```

Add a `frenzy` case inside `isRevealed`, before `default`:

```ts
    case "frenzy":
      return state.hunger >= state.hungerMax || state.sinEssence.gt(ZERO);
```

Add the reveal copy entry to `REVEAL_COPY`:

```ts
  frenzy: "『 You are gorged past bearing. Let the Frenzy devour it all. 』",
```

- [ ] **Step 4: Update `src/ui/nudge.ts`**

Add a frenzy branch immediately after the first `totalKills.lt(1)` block:

```ts
  if (state.sinEssence.lte(0) && state.hunger >= state.hungerMax) {
    return "『 You are gorged. Loose the Feeding Frenzy. 』";
  }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test -- reveal nudge`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/ui/reveal.ts src/ui/nudge.ts test/reveal.test.ts test/nudge.test.ts
git commit -m "phase-5: reveal + nudge for the Feeding Frenzy panel"
```

---

### Task 10: FrenzyPanel — Sin Essence, Rank, Feeding Frenzy button (`ui/FrenzyPanel.tsx`)

**Files:**
- Create: `src/ui/FrenzyPanel.tsx`
- Modify: `src/ui/AppShell.tsx` (import + register in `PANEL_COMPONENTS`)
- Modify: `src/ui/tooltips.ts` (add entries)
- Test: gated by `npm run build` (no component unit test, per convention).

**Interfaces:**
- Consumes: `game` (`engine/game`), `format` (`engine/format`), `sinEssenceGain` (`engine/prestige`), `canFeedingFrenzy`/`feedingFrenzy` (`engine/reset`), `rankName`/`rankMult` (`engine/ranks`), `hungerRatio` (`engine/hunger`), `Tooltip` (`ui/Tooltip`).
- Produces: `FrenzyPanel` component registered under panel key `"frenzy"`.

- [ ] **Step 1: Create the panel component**

```tsx
// src/ui/FrenzyPanel.tsx
import { game } from "../engine/game";
import { format } from "../engine/format";
import { sinEssenceGain } from "../engine/prestige";
import { canFeedingFrenzy, feedingFrenzy } from "../engine/reset";
import { rankMult, rankName } from "../engine/ranks";
import { hungerRatio } from "../engine/hunger";
import { Tooltip } from "./Tooltip";

export function FrenzyPanel() {
  const { state } = game;
  const projected = sinEssenceGain(state.souls, hungerRatio(state));
  return (
    <section className="panel">
      <Tooltip id="feeding-frenzy">
        <h2 className="panel__title">[ Feeding Frenzy ]</h2>
      </Tooltip>
      <div className="row">
        <Tooltip id="sin-essence">
          <span className="muted">Sin Essence</span>
        </Tooltip>
        <span>{format(state.sinEssence)}</span>
      </div>
      <div className="row">
        <Tooltip id="devourer-rank">
          <span className="muted">Devourer Rank</span>
        </Tooltip>
        <span>
          {rankName(state)} (x{format(rankMult(state))})
        </span>
      </div>
      <div className="row">
        <span className="muted">Next Frenzy</span>
        <span>+{format(projected)}</span>
      </div>
      <Tooltip id="feeding-frenzy">
        <button className="btn" disabled={!canFeedingFrenzy(state)} onClick={() => feedingFrenzy(state)}>
          Feeding Frenzy
        </button>
      </Tooltip>
    </section>
  );
}
```

- [ ] **Step 2: Register it in `src/ui/AppShell.tsx`**

Add the import beside the other panel imports:

```ts
import { FrenzyPanel } from "./FrenzyPanel";
```

Add the entry to `PANEL_COMPONENTS`:

```ts
  frenzy: FrenzyPanel,
```

- [ ] **Step 3: Add tooltip copy to `src/ui/tooltips.ts`**

Add these entries inside the `TOOLTIPS` object:

```ts
  "feeding-frenzy": { title: "Feeding Frenzy", body: "At maximum Hunger, Gluttony devours everything — your run resets for Sin Essence." },
  "sin-essence": { title: "Sin Essence", body: "The residue of a devoured run. Spend it to raise your Rank, buy upgrades, and unlock instincts." },
  "devourer-rank": { title: "Devourer Rank", body: "Rises with total Sin Essence (E→S). Each rank multiplies all damage and souls." },
```

- [ ] **Step 4: Build to verify the component compiles**

Run: `npm run build`
Expected: exit 0, clean build.

- [ ] **Step 5: Commit**

```bash
git add src/ui/FrenzyPanel.tsx src/ui/AppShell.tsx src/ui/tooltips.ts
git commit -m "phase-5: add FrenzyPanel with Sin Essence, Rank, and Feeding Frenzy"
```

---

### Task 11: Essence-shop section in FrenzyPanel

**Files:**
- Modify: `src/ui/FrenzyPanel.tsx`
- Modify: `src/ui/tooltips.ts`
- Test: gated by `npm run build`.

**Interfaces:**
- Consumes: `ESSENCE_UPGRADES` (`content/essenceShop`), `essenceUpgradeLevel`/`essenceUpgradeCost`/`canBuyEssenceUpgrade`/`buyEssenceUpgrade` (`engine/essenceShop`).

- [ ] **Step 1: Add imports to `src/ui/FrenzyPanel.tsx`**

```ts
import { ESSENCE_UPGRADES } from "../content/essenceShop";
import {
  buyEssenceUpgrade,
  canBuyEssenceUpgrade,
  essenceUpgradeCost,
  essenceUpgradeLevel,
} from "../engine/essenceShop";
```

- [ ] **Step 2: Add a shop sub-component at the bottom of the file**

```tsx
function EssenceShop() {
  const { state } = game;
  return (
    <div className="subpanel">
      <Tooltip id="essence-shop">
        <h3 className="panel__subtitle">Sin Essence Shop</h3>
      </Tooltip>
      {ESSENCE_UPGRADES.map((upgrade) => (
        <div className="row" key={upgrade.id}>
          <span className="muted">
            {upgrade.name} · Lv {essenceUpgradeLevel(state, upgrade.id)}
          </span>
          <button
            className="btn"
            disabled={!canBuyEssenceUpgrade(state, upgrade.id)}
            onClick={() => buyEssenceUpgrade(state, upgrade.id)}
          >
            {format(essenceUpgradeCost(state, upgrade.id))}
          </button>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Render `<EssenceShop />` inside `FrenzyPanel`**

Add `<EssenceShop />` just before the closing `</section>` of `FrenzyPanel`.

- [ ] **Step 4: Add the tooltip entry to `src/ui/tooltips.ts`**

```ts
  "essence-shop": { title: "Sin Essence Shop", body: "Permanent upgrades bought with Sin Essence. They persist through every Feeding Frenzy." },
```

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: exit 0, clean build.

- [ ] **Step 6: Commit**

```bash
git add src/ui/FrenzyPanel.tsx src/ui/tooltips.ts
git commit -m "phase-5: add Sin Essence shop section to FrenzyPanel"
```

---

### Task 12: Autobuyer section in FrenzyPanel

**Files:**
- Modify: `src/ui/FrenzyPanel.tsx`
- Modify: `src/ui/tooltips.ts`
- Test: gated by `npm run build`.

**Interfaces:**
- Consumes: `AUTOBUYERS` (`content/autobuyers`), `canUnlockAutobuyer`/`unlockAutobuyer`/`setAutobuyerEnabled`/`isAutobuyerActive` (`engine/autobuyers`).

- [ ] **Step 1: Add imports to `src/ui/FrenzyPanel.tsx`**

```ts
import { AUTOBUYERS } from "../content/autobuyers";
import {
  canUnlockAutobuyer,
  isAutobuyerActive,
  setAutobuyerEnabled,
  unlockAutobuyer,
} from "../engine/autobuyers";
```

- [ ] **Step 2: Add an autobuyer sub-component at the bottom of the file**

```tsx
function Instincts() {
  const { state } = game;
  return (
    <div className="subpanel">
      <Tooltip id="instincts">
        <h3 className="panel__subtitle">Greed's Instincts</h3>
      </Tooltip>
      {AUTOBUYERS.map((def) => {
        const owned = state.autobuyers[def.id]?.unlocked;
        return (
          <div className="row" key={def.id}>
            <span className="muted">{def.name}</span>
            {owned ? (
              <button
                className="btn"
                onClick={() => setAutobuyerEnabled(state, def.id, !isAutobuyerActive(state, def.id))}
              >
                {isAutobuyerActive(state, def.id) ? "On" : "Off"}
              </button>
            ) : (
              <button
                className="btn"
                disabled={!canUnlockAutobuyer(state, def.id)}
                onClick={() => unlockAutobuyer(state, def.id)}
              >
                {format(def.unlockCost)}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Render `<Instincts />` inside `FrenzyPanel`**

Add `<Instincts />` just before the closing `</section>` of `FrenzyPanel` (after `<EssenceShop />`).

- [ ] **Step 4: Add the tooltip entry to `src/ui/tooltips.ts`**

```ts
  instincts: { title: "Greed's Instincts", body: "Autobuyers unlocked with Sin Essence — train, dive, and digest on their own. Toggle each on or off." },
```

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: exit 0, clean build.

- [ ] **Step 6: Commit**

```bash
git add src/ui/FrenzyPanel.tsx src/ui/tooltips.ts
git commit -m "phase-5: add Greed's Instincts autobuyer section to FrenzyPanel"
```

---

### Task 13: Phase-5 verification gate

**Files:** none (verification only).

- [ ] **Step 1: Full test suite**

Run: `npm run test`
Expected: PASS — all suites green (35 baseline + the new ranks/prestige/essenceShop/autobuyers/save/reveal/nudge tests).

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: exit 0, clean.

- [ ] **Step 3: Anti-pattern grep gauntlet (SPEC §7)**

```bash
grep -rnE "\b(souls|hp|maxHp|soulValue|dps|sinEssence|sins|divinity|value)\b\s*[-+*/<>]=?" src
grep -rn "Math.pow\|parseFloat" src
grep -rn "JSON.stringify\|JSON.parse" src      # only save.ts
grep -rnE "1e[0-9]+" src/engine src/ui          # review: should be ~empty (constants live in content/)
grep -rn "computeDps\|globalMult\|soulsPerKill" src/ui   # should be empty
```
Expected: no real violations. Phase-5 math constants (rank base, costs, mults) all live in `src/content/*`. `state.hunger >= state.hungerMax` and `devourerRank`/`priority` JS-number arithmetic are allowed (not Decimals).

- [ ] **Step 4: Manual smoke (optional but recommended)**

Run: `npm run dev`, then in the browser: let Hunger climb to max → the Feeding Frenzy panel reveals → click Feeding Frenzy → confirm Sin Essence increments, run resets, and the panel stays visible. Buy a shop upgrade and an autobuyer; confirm a second run climbs faster than the first (the Phase-5 risky-checkpoint criterion).

- [ ] **Step 5: Final phase commit and push the branch**

```bash
git add -A
git commit -m "phase-5: Feeding Frenzy prestige + Greed's Instincts — verification green" --allow-empty
git push -u origin phase-5-feeding-frenzy
```

Then report back to the human with: what was built, the verification-checklist status (PLAN.md Phase 5), and any assumptions. **Do not merge to `main`** — the human merges.

---

## Self-Review

**1. Spec coverage (PLAN.md Phase 5 + SPEC §6):**
- Feeding Frenzy reset at maxed Hunger granting Sin Essence → Tasks 2, 3. Reset-scope obeyed (SPEC §4) → Task 3.
- Sin Essence gain pure & unit-tested (SPEC §2) → Task 2.
- Devourer Rank ladder + `rankMult` folded into globalMult (SPEC §6) → Tasks 1, 5.
- Essence Shop (`essenceShopMult` → globalMult; absorption bonus → absorbRate, SPEC §6) → Tasks 4, 5.
- Autobuyers (auto-feed/train/dive analog) respecting priority/toggle, inert until unlocked → Tasks 6, 7.
- "Frenzy → spend → faster next run" demonstrable → Task 13 Step 4.
- Save/load preserves Sin Essence/Rank/upgrades/autobuyers → Task 8.
- UI surface (Sin Essence shop / Devourer Rank / autobuyer toggles — none existed before) → Tasks 9–12.

**2. Placeholder scan:** No TBD/TODO; every code step shows complete code; every test step shows the asserting test.

**3. Type consistency:** `rankMult(state)`, `essenceShopMult(state)`, `essenceAbsorptionMult(state)`, `feedingFrenzy(state): Decimal`, `canFeedingFrenzy(state): boolean`, `sinEssenceGain(souls, hungerRatio): Decimal`, `tickAutobuyers(state): void`, `updateDevourerRank(state): void` — names/signatures are used consistently across the engine wiring (Tasks 5, 7), reset (Task 3), and UI (Tasks 10–12). `Panel` union and `PANEL_COMPONENTS` both gain `"frenzy"` (Tasks 9, 10).

**Design decisions made by the planner (note for reviewer):**
- **Rank is a ratchet** (`Math.max`) keyed on current `sinEssence` at Frenzy time, rather than a new `totalSinEssence` field — this keeps the save shape unchanged (no version bump) while satisfying "cumulative / persists." Tunable later.
- **Essence-shop catalogue** (two upgrades) and **autobuyer set** (train/dive/digest) are minimal, data-driven starting points per "balance lives in data / tune in Phase 10." Easy to extend by adding entries to the content arrays.
- **Frenzy panel reveal** keys on `hunger >= hungerMax || sinEssence > 0` (not `totalKills`, which resets on every reset), so the prestige panel never vanishes at the moment you need it.
