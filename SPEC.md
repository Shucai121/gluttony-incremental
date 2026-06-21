# SPEC.md — Binding Engineering Contracts (Berserk of Gluttony Incremental)

This file is **authoritative**. If anything here conflicts with PLAN.md, this file wins.
Codex: do not invent alternative shapes for the contracts below — copy them.

Design direction: **B — Devour Engine**. Challenges = **Sin Trials**.

---

## 0. Rules of Engagement (non-negotiable)

1. **Big numbers:** Every currency, cost, stat value, enemy HP, DPS, and Souls amount is a
   `Decimal` (`break_infinity.js`). **Never** a JS `number`. JS `number` is only for: array
   indices, timestamps (epoch ms), `rank`/`zone`/form indices, `priority`, skill `level`
   (small int), and config like `autosaveSec`. Hunger is a `number` in `[0, hungerMax]` (it's
   bounded and never astronomically large — see §2).
2. **No JS operators on Decimals.** `a + b`, `a > b`, `a * b` are BUGS → `a.add(b)`, `a.gt(b)`,
   `a.mul(b)`. Decimal methods are immutable (return new Decimals).
3. **One phase at a time, in order.** Don't start phase N+1 until phase N's PLAN.md checklist is green.
4. **Definition of Done per phase** = checklist green AND `npm run test` AND `npm run build`
   pass AND the §7 grep gauntlet is clean. Commit `phase-N: <summary>` after each.
5. **Balance lives in data, not logic.** All tunable constants in `src/content/*.ts` (§6).
6. **Resets are centralized** in `src/engine/reset.ts` and obey the reset-scope table (§4).
   Adding a state field → add it to that table.
7. **Combat is the single source of DPS/Souls.** All multipliers (Greed, ranks, perks, hunger,
   skills) fold into ONE `computeDps` and ONE `soulsPerKill` (§2). Never scatter `if`s.
8. **When unsure, do the simplest thing that satisfies the checklist.** No features outside the plan.

---

## 1. Project Conventions

- **Node 20 LTS+**, **npm**. Scripts: `dev` (vite), `build` (`tsc && vite build`), `test`
  (`vitest run`), `test:watch`.
- **TypeScript `strict: true`.** No `any` except the save (de)serializer walker.
- **Directory layout (target):**
  ```
  src/
    engine/   decimal.ts loop.ts save.ts combat.ts training.ts hunger.ts reset.ts greed.ts
              sinTrial.ts skills.ts
    content/  stats.ts enemies.ts zones.ts greed.ts ranks.ts essenceShop.ts sins.ts skills.ts
              appraisal.ts sinTree.ts perks.ts achievements.ts
    state/    types.ts store.ts
    ui/       StatusWindow.tsx EnemyPanel.tsx StatPanel.tsx GreedPanel.tsx HungerBar.tsx
              Notifications.tsx ...
    main.tsx App.tsx
  test/  *.test.ts
  ```
- Stat ids are an UPPERCASE string-literal union (§3).

---

## 2. Copy-Ready Code Stubs & Formulas (use verbatim; extend, don't replace)

### `src/engine/decimal.ts`
```ts
import Decimal from "break_infinity.js";
export { Decimal };
export type DecimalSource = Decimal | number | string; // local def — not exported as Decimal.DecimalSource

export const D = (x: DecimalSource): Decimal => new Decimal(x);
export const ZERO = new Decimal(0);
export const ONE = new Decimal(1);

// Cost of the (purchased)-th buy: base * mult^purchased  (geometric)
export const geometricCost = (base: DecimalSource, mult: DecimalSource, purchased: DecimalSource): Decimal =>
  D(base).mul(D(mult).pow(D(purchased)));
```

### `src/engine/loop.ts`
```ts
export type TickFn = (deltaSec: number) => void;
const TICK_MS = 50;        // 20 logical updates/sec
const MAX_CATCHUP = 2000;  // cap ticks per animation frame

/** Fixed-timestep accumulator loop. Returns stop(). */
export function startLoop(tick: TickFn): () => void {
  let last = performance.now();
  let acc = 0;
  let raf = 0;
  const frame = (now: number) => {
    acc += now - last; last = now;
    let steps = 0;
    while (acc >= TICK_MS && steps < MAX_CATCHUP) { tick(TICK_MS / 1000); acc -= TICK_MS; steps++; }
    if (steps >= MAX_CATCHUP) acc = 0; // drop backlog instead of freezing
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}
```

### `src/engine/save.ts` — Decimal-safe serialization (library-internals-independent)
```ts
import { Decimal } from "./decimal";
const KEY = "bog-incremental-save";

// CONFIRMED: break_infinity's Decimal defines toJSON(), so a naive JSON.stringify *replacer*
// never receives a Decimal instance. encode() walks the LIVE object first to dodge that.
export function encode(v: any): any {                  // walk LIVE object so instanceof works
  if (v instanceof Decimal) return { __dec: v.toString() };
  if (Array.isArray(v)) return v.map(encode);
  if (v && typeof v === "object") { const o: any = {}; for (const k in v) o[k] = encode(v[k]); return o; }
  return v;
}
function decode(v: any): any {
  if (Array.isArray(v)) return v.map(decode);
  if (v && typeof v === "object") {
    if (typeof v.__dec === "string") return new Decimal(v.__dec);
    const o: any = {}; for (const k in v) o[k] = decode(v[k]); return o;
  }
  return v;
}
export function decode(v: any): any { /* mirror: arrays, {__dec}->new Decimal, recurse */ }
export function saveGame(state: unknown): void { localStorage.setItem(KEY, JSON.stringify(encode(state))); }
export function loadRaw(): any | null { const s = localStorage.getItem(KEY); return s ? decode(JSON.parse(s)) : null; }
export function clearSave(): void { localStorage.removeItem(KEY); }
```
> Caller: `deepMerge(defaultState(), migrate(loadRaw() ?? {}))` so new fields get defaults.
> Offline progress = `Date.now() - state.lastSave`, clamp, run catch-up ticks (gated by `settings.offlineProgress`).

### Combat formulas (`src/engine/combat.ts`, `hunger.ts`) — the canonical math
> Constants in CAPS come from `src/content/*` (§6). `globalMult` is composed in ONE place (§6).

```ts
// --- Derived combat power (ONE source of truth) ---
// dps = (STR + MAG) * critMult(DEX) * frenzyMult(AGI, frenzyBought) * greedMult * skillMult * hungerCombatMult * globalMult
critMult   = ONE.add(dex.value.mul(CRIT_PER_DEX));
frenzyMult = ONE.add(agi.value.div(AGI_SCALE)).mul(D(FRENZY_PER_BUY).pow(focusFrenzyBought));
hungerCombatMult = ONE.add(D(hungerRatio).mul(HUNGER_DPS_BONUS));   // hungerRatio = hunger / hungerMax  (0..1)
dps = str.value.add(mag.value).mul(critMult).mul(frenzyMult).mul(greedMult).mul(skillMult).mul(hungerCombatMult).mul(globalMult);

// --- Per tick ---
current.hp = current.hp.sub(dps.mul(deltaSec));
hunger = clamp(hunger + HUNGER_RATE * deltaSec / (1 + mnd.value.div(MND_SCALE).toNumber()), 0, hungerMax);
if (current.hp.lte(0)) kill();

// --- On kill ---
soulsPerKill = current.soulValue.mul(ONE.add(D(hungerRatio).mul(HUNGER_SOUL_BONUS))).mul(globalMult);
souls = souls.add(soulsPerKill);
for (const s of STAT_ORDER)                         // DEVOUR: absorb a fraction of enemy stats
  stats[s].value = stats[s].value.add(current.stats[s].mul(absorbRate));   // absorbRate = §6
hunger = Math.max(0, hunger - FEED_PER_KILL);
maybeDropSkill(current);                            // Phase 6
totalKills += 1;
current = spawnEnemy(zone, totalKills);             // §6 scaling
```
> `absorbRate = BASE_ABSORB * absorptionMult * (1 + MND/MND_SCALE)`, where `absorptionMult`
> grows with `awakenings` and essence-shop upgrades. This compounding is the exponential engine.

### Prestige gain (Phase 5 reference — monotonic, ≥1 at trigger)
```ts
// break_infinity.js: .log10() returns a JS number. (break_eternity returns Decimal — Phase 7 audit!)
export function sinEssenceGain(souls: Decimal, hungerRatio: number): Decimal {
  const l = souls.max(1).log10();                                  // run size
  return new Decimal(Math.floor(10 ** Math.max(0, (l - 30) / 30)))
    .mul(1 + hungerRatio)                                          // riding high hunger pays more
    .max(1);
}
```

---

## 3. Canonical State Shape (`src/state/types.ts`)

Define as the **target** now; later-phase fields default to empty/zero but use these exact
names/types so nothing needs refactoring.

```ts
import { Decimal } from "../engine/decimal";

export type StatId = "STR" | "VIT" | "AGI" | "DEX" | "MAG" | "MND";
export const STAT_ORDER: StatId[] = ["STR", "VIT", "AGI", "DEX", "MAG", "MND"];

export interface StatState { value: Decimal; trained: Decimal; } // value = base + trained + absorbed
export interface EnemyState {
  hp: Decimal; maxHp: Decimal; soulValue: Decimal; tier: number;
  stats: Record<StatId, Decimal>; skillDropId: string | null;
}

export interface GameState {
  version: number;
  lastSave: number; // epoch ms

  // Phase 2 — combat & devour
  souls: Decimal;
  stats: Record<StatId, StatState>;
  frenzyBought: Decimal;        // attack-speed buyable (tickspeed analog)
  current: EnemyState;          // current enemy in the queue
  totalKills: Decimal;

  // Phase 3 — hunger, zones, in-run resets
  hunger: number;               // 0..hungerMax (bounded)
  hungerMax: number;
  zone: number;                 // current zone index
  maxZone: number;              // deepest reached
  gluttonyLevel: Decimal;       // Digest count (Boost analog)
  awakenings: Decimal;          // Awaken Gluttony count (Galaxy analog)

  // Phase 4 — Greed
  greed: { form: number; bloodCharge: Decimal };

  // Phase 5 — Feeding Frenzy prestige
  sinEssence: Decimal;
  devourerRank: number;         // index into RANKS (§6)
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

  settings: { notation: "standard" | "scientific" | "engineering"; offlineProgress: boolean; autosaveSec: number };
}
```
> `defaultState(): GameState` initializes every field (Decimals `ZERO`/`ONE`, records `{}`,
> `current = spawnEnemy(0, ZERO)`, `hunger = 0`, `hungerMax = 100`). `load()` deep-merges over it.

---

## 4. Reset-Scope Table (the #1 source of bugs — obey exactly)

Implemented in `src/engine/reset.ts`. CLEAR = set to default; KEEP = untouched; +gain = add
reward before clearing. Each reset also performs every clear of all shallower resets.

| Field                                   | Digest | Awaken | Feeding Frenzy | Mortal Sin | Transcendence |
| --------------------------------------- | :----: | :----: | :------------: | :--------: | :-----------: |
| souls, stats, current, totalKills, zone | CLEAR  | CLEAR  |     CLEAR      |   CLEAR    |     CLEAR     |
| frenzyBought                            | CLEAR  | CLEAR  |     CLEAR      |   CLEAR    |     CLEAR     |
| hunger                                  | reset0 | reset0 |     reset0     |   reset0   |    reset0     |
| gluttonyLevel (Digest count)            |  +1    | CLEAR  |     CLEAR      |   CLEAR    |     CLEAR     |
| awakenings                              | KEEP   | +1     |     CLEAR      |   CLEAR    |     CLEAR     |
| greed (form/charge)                     | KEEP   | KEEP   |  charge→0,form KEEP | CLEAR  |    CLEAR      |
| sinEssence                              | KEEP   | KEEP   |   +gain/KEEP   |   CLEAR    |     CLEAR     |
| devourerRank, essenceUpgrades           | KEEP   | KEEP   |     KEEP       |   CLEAR    |     CLEAR     |
| autobuyers (unlocked/config)            | KEEP   | KEEP   |     KEEP       |   KEEP     |     CLEAR     |
| sinTrials(cleared), skills, appraisal   | KEEP   | KEEP   |     KEEP       |   KEEP     |     CLEAR     |
| sins, mortalSins, sinTree               | KEEP   | KEEP   |     KEEP       | +gain/KEEP |     CLEAR     |
| divinity, transcendences                | KEEP   | KEEP   |     KEEP       |   KEEP     |   +gain/KEEP  |
| perks, achievements, titles, settings   | KEEP   | KEEP   |     KEEP       |   KEEP     |     KEEP      |

Rule of thumb: **a reset never destroys its own reward currency or anything shallower's
persistent rewards.** Transcendence wipes all but `perks/achievements/titles/settings` and its
own `divinity/transcendences`.

---

## 5. Save Versioning & Migration

- `version` starts at `1`. Bump on meaningful shape changes.
- `migrate(raw): any` switches on `raw.version`, transforms forward one step at a time, sets
  current version. Unknown/newer → log + fall back to `defaultState()` (never crash).
- Always `deepMerge(defaultState(), migratedRaw)`.
- Test: a hand-written `version: 1` save loads under the current version without loss.

---

## 6. Balance Constants (starting values — TUNE in Phase 10; keep in `src/content/*`)

Conservative starting curves so nobody guesses. All `1eN` are Decimal sources.

### `content/stats.ts` (Training costs — spend Souls to raise a stat)
| Stat | role                         | trainBaseCost | trainCostMult |
| ---- | ---------------------------- | ------------- | ------------- |
| STR  | physical attack              | `1e1`         | `1.6`         |
| MAG  | magic attack                 | `1e1`         | `1.65`        |
| AGI  | attack speed (Frenzy)        | `1e2`         | `1.7`         |
| DEX  | crit / accuracy multiplier   | `1e2`         | `1.7`         |
| VIT  | max HP / dive depth          | `5e1`         | `1.55`        |
| MND  | hunger control + absorption  | `1e3`         | `1.9`         |

### `content/combat.ts` constants
- `CRIT_PER_DEX = 0.01`  · `AGI_SCALE = 100` · `FRENZY_PER_BUY = 1.1` (frenzy buyable: base cost `1e3`, mult `1.5`)
- `HUNGER_DPS_BONUS = 0.5` (at full hunger, +50% DPS) · `MND_SCALE = 1000`
- `BASE_ABSORB = 0.02` (absorb 2% of enemy stats per kill) · absorb steepened by `awakenings`:
  `absorptionMult = D(1.5).pow(awakenings)` × essence-shop bonus.

### `content/hunger.ts`
- `hungerMax = 100` · `HUNGER_RATE = 4` (units/sec, before MND reduction) · `FEED_PER_KILL = 5`
- `HUNGER_SOUL_BONUS = 1.0` (at full hunger, ×2 Souls/kill).
- Feeding Frenzy unlocks when `hunger >= hungerMax` (default trigger).

### `content/enemies.ts` + `content/zones.ts` (geometric scaling)
- `spawnEnemy(zone, totalKills)`:
  - `maxHp     = D("1e1").mul(D(1.15).pow(totalKills)).mul(D(8).pow(zone))`
  - `soulValue = D("1e0").mul(D(1.12).pow(totalKills)).mul(D(5).pow(zone))`
  - `stats[s]  = D("1e0").mul(D(1.13).pow(totalKills)).mul(D(6).pow(zone))` (per stat)
  - `tier = zone`; `skillDropId` = roll from the zone's drop table (Phase 6).
- Advance zone when `totalKills` in-zone ≥ threshold or player chooses; VIT gates safe depth.

### `content/ranks.ts`
- `RANKS = ["E","D","C","B","A","S"]` (devourerRank = index).
- Rank-up thresholds on cumulative `sinEssence`: `[0, 50, 5e3, 5e5, 1e8, 1e12]`.
- Each rank: `rankMult = D(3).pow(devourerRank)`.

### Prestige gains
- **Sin Essence (Feeding Frenzy):** §2 `sinEssenceGain`. Trigger: `hunger >= hungerMax`.
- **Sins (Mortal Sin):** unlock at Rank ≥ S. `sinsGain = floor(sinEssence ^ 0.5)` (tunable).
- **Divinity (Transcendence):** unlock at `mortalSins.gte(N)`. `gain = floor(log10(sins+1))` (tunable).

### Global multiplier (single source of truth in `engine/combat.ts`)
```
globalMult = digestMult(gluttonyLevel) * rankMult(devourerRank) * essenceShopMult
           * sinTreeMult * perkMult * achievementMult
```
Compute once per tick; never scatter multipliers across files. `greedMult`, `skillMult`,
`hungerCombatMult`, `frenzyMult`, `critMult` are applied in `computeDps` (§2), NOT inside globalMult.

---

## 7. Anti-Pattern Grep Gauntlet (run before declaring any phase done)

```bash
# JS arithmetic/comparison adjacent to a likely-Decimal identifier (manual review hits):
grep -rnE "\b(souls|hp|maxHp|soulValue|dps|sinEssence|sins|divinity|value)\b\s*[-+*/<>]=?" src

# Float math on Decimals (use Decimal methods):  (Hunger math on JS numbers is OK)
grep -rn "Math.pow\|parseFloat" src

# Raw JSON on state outside the helpers:
grep -rn "JSON.stringify\|JSON.parse" src      # only save.ts should match

# Hardcoded balance numbers outside content/:
grep -rnE "1e[0-9]+" src/engine src/ui         # review hits; move constants to content/

# Scattered multipliers / combat math leaking into UI:
grep -rn "computeDps\|globalMult\|soulsPerKill" src/ui   # should be ~empty (UI reads results, not math)
```
A clean run (or justified, reviewed exceptions) is required to mark a phase complete.

> Note: `hunger`, `hungerMax`, and their rates are intentionally JS `number`s (bounded 0..100),
> so JS arithmetic on *those* identifiers is expected and fine.
