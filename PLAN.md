# Implementation Plan — "Berserk of Gluttony" Incremental (working title)

> **HAND-OFF NOTE (read first):** This file is the *narrative* plan (what/why per phase).
> The binding engineering contracts live in **`SPEC.md`** — canonical `GameState` shape,
> reset-scope table, big-number rules, copy-ready code stubs, combat/devour formulas, and
> balance constants. When PLAN.md and SPEC.md disagree, **SPEC.md wins**. To start, follow
> **`HANDOFF.md`**.

An incremental/idle game built on the *Antimatter Dimensions* reset skeleton but with a
**Berserk of Gluttony** engine. Core fantasy: you bear the cursed skill **Gluttony** — you
grow by **devouring what you kill**, stealing their **stats and skills** — while a **Hunger**
meter constantly threatens to consume you. Power comes at a price: the sentient sword **Greed**
makes you stronger by drinking your own blood/stats, and only by **devouring** can you keep the
hunger at bay.

Design direction chosen: **B — Devour Engine**. Challenges reworked as **Sin Trials**.

This plan is executed **phase by phase in fresh chat contexts**. Each phase is self-contained.
Do not skip Phase 0.

---

## Design North Star (read once, keep in mind every phase)

**What replaces the Antimatter Dimensions parts:**

| Antimatter Dimensions            | This game (Devour Engine)                                  |
| -------------------------------- | --------------------------------------------------------- |
| Antimatter (currency)            | **Souls** (主currency, from devouring kills)               |
| 8 Dimensions buying each other   | **Combat & Devour loop** — auto-battle an enemy queue      |
| Buying dimension levels          | **Training** — spend Souls to raise the 6 stats            |
| The 8 dimensions                 | **6 stats**: STR, VIT, AGI, DEX, MAG, MND (BoG's sheet)    |
| Tickspeed                        | **Frenzy** (attack speed / devour rate)                    |
| Dimension Boost                  | **Digest** (reset run → stacking global multiplier)        |
| Antimatter Galaxy                | **Awaken Gluttony** (reset → stronger absorption scaling)   |
| Infinity (forced @1.8e308)       | **Feeding Frenzy** (Hunger overload forces the reset)       |
| Eternity                         | **Mortal Sin Awakening** (become a Sin holder)              |
| Reality                          | **Transcendence / God's Domain** (meta perks)               |
| Challenges                       | **Sin Trials** (beat a Deadly-Sin boss under a constraint)  |
| Autobuyers                       | **Greed's instincts** (auto-feed / auto-train / auto-dive)  |

**The signature mechanics that make it Gluttony, not an AD clone:**
1. **Devour = compounding growth.** Every kill grants Souls **and absorbs a fraction of the
   enemy's stats into yours**. Stronger enemies → bigger absorption → stronger you. This
   compounding *is* the exponential engine (AD's "dimensions produce dimensions" analog).
2. **Hunger is a live, two-sided resource.** It rises every second; feeding (kills) lowers it.
   High hunger = **more Souls per kill** (risk/reward); maxed hunger = **forced Feeding Frenzy**
   prestige (replaces AD's 1.8e308 cap). MND tames the hunger rate.
3. **Greed (the sword)** is the dominant multiplier track, advanced through forms
   (Black Sword → Scythe → Bow → Bloody Frame) by **spending your own stats/HP** — power at a cost.
4. **Skill Library + Appraisal.** Devoured enemies drop **Skills** you collect/level/equip;
   **Appraisal** reveals enemy stats/drops and unlocks deeper prey.
5. **`[Appraisal]` / status-window flavor** — every event fires a BoG-style readout popup
   (`Skill 'Gluttony' devoured the enemy. STR +120, AGI +44.`).

**Stat roles (combat model):** STR = physical attack · MAG = magic attack · AGI = attack
speed (Frenzy) · DEX = crit/accuracy multiplier · VIT = max HP / dive depth · MND = hunger
control + absorption rate + skill power. (Exact formulas: SPEC §2/§6.)

---

## Recommended Tech Stack (decided — don't re-litigate per phase)

TypeScript (strict) · Vite · React 18 + **Zustand** · **`break_infinity.js`** (`Decimal`),
swapping to **`break_eternity.js`** (drop-in) at Phase 7 · `localStorage` save with versioned
migration · Vitest. Dark "status-window" aesthetic (translucent panels, monospace readouts).

---

## Phase 0 — Documentation Discovery (DONE — consolidated)

> Re-read at the start of any phase touching big-number math. Don't assume Decimal methods.

**Sources of truth:**
- `break_infinity.js`: https://github.com/Patashu/break_infinity.js (README + `index.d.ts`)
- `break_eternity.js`: https://github.com/Patashu/break_eternity.js (README — conversion notes)
- API: https://patashu.github.io/break_infinity.js/index.html
- AD reset skeleton (we reskin its structure): https://antimatter-dimensions.fandom.com/wiki/Guide

**Allowed `Decimal` API** (both libs share the interface): construction `new Decimal(x)`;
arithmetic `.add/.plus .sub/.minus .mul/.times .div/.dividedBy .recip .pow .root .log .log10
.ln .exp .sqrt .abs .neg .floor .ceil .round .mod .max .min`; comparison `.cmp .eq .gt .gte
.lt .lte`; display `.toString() .toNumber()`. All methods return **new** Decimals (immutable).

**⚠️ Anti-patterns:** JS operators (`+ - * / > <`) do **not** work on Decimals — use methods.
Decimals are immutable. break_eternity's `log/log10/ln` return **Decimal not number** (audit at
Phase 7 swap). Never store a currency as a JS `number`. Never `JSON.stringify` a Decimal
without the serializer (SPEC §2).

---

## Phase 1 — Scaffold, Big-Number Core, Game Loop, Save System

**Goal:** A running app that ticks a fixed-timestep loop, holds Decimal state, renders a
placeholder status window, and saves/loads to localStorage without corruption.

**What to implement (use SPEC stubs verbatim):**
1. `npm create vite@latest . -- --template react-ts`; `npm i break_infinity.js zustand`; add
   `vitest`. Wire `dev`/`build`/`test` scripts (SPEC §1).
2. `src/engine/decimal.ts`, `src/engine/loop.ts`, `src/engine/save.ts` — **copy from SPEC §2**.
3. `src/engine/format.ts` — number formatter (scientific ≥1e6, notation toggle). Unit-tested.
4. `src/state/types.ts` + `src/state/store.ts` — paste the canonical `GameState` (SPEC §3) and
   `defaultState()`; Zustand store; load = `deepMerge(defaultState(), migrate(loadRaw()))`.
5. `src/ui/StatusWindow.tsx` — placeholder panel showing Souls + a live tick counter, styled as
   a translucent status window. Proves loop + store + render end-to-end. Autosave every 10s.

**Verification checklist:**
- [ ] `npm run dev` renders the status window; tick counter increments smoothly.
- [ ] Console: `new Decimal("1e500").add("1e500").toString()` → `2e500` (big-number math works).
- [ ] Reload → state restored from localStorage (round-trip works).
- [ ] Vitest: `format` boundaries + `encode→decode` Decimal round-trip pass.

**Anti-pattern guards:** No raw `number` for Souls. No naive `JSON.stringify(decimal)`. No
`setInterval` production loop. No Decimal `+`/`>`.

---

## Phase 2 — Combat & Devour Engine (the beating heart)

**Goal:** Auto-battle an enemy queue; kills grant Souls, **absorb enemy stats**, and the 6
stats drive combat. Plus **Training** (spend Souls on stats) and **Frenzy** (attack speed).
This is the compounding exponential core (AD "dimensions + tickspeed" analog).

**What to implement (follow SPEC §2 combat formulas + §6 balance):**
1. `src/content/stats.ts` — the 6 stats (id, role, training baseCost, costMult) — SPEC §6.
2. `src/content/enemies.ts` — enemy generation: `spawnEnemy(zone, totalKills)` → `{ hp, maxHp,
   stats, soulValue, tier, skillDrop? }` with the geometric scaling in SPEC §6.
3. `src/engine/combat.ts`:
   - `computeDps(state)` from STR+MAG, crit (DEX), Frenzy/AGI, greedMult, globalMult (SPEC §2).
   - Per tick: subtract `dps * deltaSec` from `current.hp`; on `hp ≤ 0` → **kill()**.
   - `kill()`: add Souls (`soulValue × hungerSoulMult × globalMult`), **absorb** each stat
     (`stat.value += enemy.stat × absorbRate`), reduce **Hunger**, roll skill drop, spawn next.
4. `src/engine/training.ts` — `trainStat(id)`: `cost = geometricCost(base, mult, trained)`;
   raises `stat.value` + `stat.trained`. Support buy-1 / buy-max. **Frenzy** is its own
   buyable that multiplies attack speed (AGI-scaled).
5. UI: `EnemyPanel` (current enemy HP bar, soul value, tier) + `StatPanel` (6 stats: value,
   train cost, Buy) + Souls/sec readout. Wire into the Phase 1 loop.

**Verification checklist:**
- [ ] Kills produce Souls; enemy HP and soul value scale up as you descend the queue.
- [ ] **Absorption compounds:** idling raises stats over time without training (devour works).
- [ ] Training raises stats and visibly increases DPS / Souls/sec; "buy max" never overspends.
- [ ] All combat math stays Decimal-exact past 1e308.
- [ ] Vitest: a deterministic N-tick sim yields expected Souls + stat growth within tolerance.

**Anti-pattern guards:** Combat math lives in `combat.ts`, never the UI. Costs via
`Decimal.pow`, never `Math.pow`. No JS `>` for affordability/HP checks.

---

## Phase 3 — Hunger, Zones, and In-Run Resets (Digest + Awaken Gluttony)

**Goal:** Add the Hunger tension, depth via Zones, and the two in-run prestige resets (AD
Boost + Galaxy analogs).

**What to implement:**
1. **Hunger meter** (`src/engine/hunger.ts`): rises `HUNGER_RATE × deltaSec` (reduced by MND);
   each kill subtracts `feedPerKill`. `hungerSoulMult` scales Souls/kill with the hunger ratio
   (risk/reward). Clamp `[0, hungerMax]`. Expose `hungerRatio`. (Overload → Phase 5.)
2. **Zones** (`src/content/zones.ts` + advance logic): deeper zone = stronger enemies + more
   Souls/absorption. Player advances when strong enough (manual button now; auto later). VIT
   gates max safe depth (optional enemy chip damage → drop a zone on defeat; keep mild).
3. **Digest** (Boost analog, `engine/reset.ts`): unlock at a kill/stat threshold; reset Souls +
   stats + zone for a stacking **global multiplier**; raises **Gluttony Level**. Notify
   `Gluttony Lv N.`
4. **Awaken Gluttony** (Galaxy analog): unlock after enough Digests; reset Digests too, but each
   Awakening steepens **absorption rate** scaling (the dominant lever). Track `awakenings`.

**Verification checklist:**
- [ ] Hunger visibly rises and is held down by kills; higher hunger → more Souls/kill.
- [ ] Advancing a zone meaningfully raises enemy HP + rewards.
- [ ] Digest resets the run but keeps Gluttony Level + multiplier; runs are faster after.
- [ ] Awaken resets Digests and visibly steepens absorption growth.
- [ ] Save/load preserves Gluttony Level, awakenings, multipliers, hunger, zone.

**Anti-pattern guards:** One `resetRun(state, scope)` helper obeying the SPEC §4 table — no
per-layer copy-paste. Notifications fire once per event (guard flag), never every tick.

---

## Phase 4 — Greed, the Sentient Sword

**Goal:** The signature risk/reward power track. A weapon-form ladder advanced by **spending
your own stats/HP** (Bloody Frame), granting big multipliers + an active burst.

**What to implement:**
1. `src/content/greed.ts` — form ladder (Black Sword → Scythe → Bow → Bloody Frame → …): each
   form's `damageMult`, `unlockCost` (paid in Souls **and** a slice of current stats/max-HP),
   and any special (e.g. Bow = ranged auto-attack speed, Bloody Frame = huge mult that drains HP).
2. `src/engine/greed.ts` — `advanceForm()` (spends the blood cost, applies multiplier);
   `greedMult(state)` folded into `computeDps`. Optional **blood charge** resource for an active
   burst skill (spend HP → temporary ×N DPS).
3. UI: Greed panel showing current form, next-form cost (in stats/HP), and the active burst.

**Verification checklist:**
- [ ] Advancing a form spends the stat/HP cost and raises DPS by its multiplier.
- [ ] Greed's multiplier is reflected in `computeDps` (single source of truth, not the UI).
- [ ] Blood-cost mechanics can't drive stats/HP negative; burst expires correctly.
- [ ] Greed state survives save/load.

**Anti-pattern guards:** Don't special-case Greed inside combat with `if` spaghetti — expose
`greedMult` and feed it into the one DPS function. Costs are Decimal.

---

## Phase 5 — Feeding Frenzy (Prestige Layer 1) + Greed's Instincts (automation)

**Goal:** The "Infinity" of this game — **Hunger overload forces a full reset** for a
meta-currency and a Rank, plus the first autobuyers.

**What to implement:**
1. **Feeding Frenzy** (Big Crunch analog): when **Hunger maxes** (default) — or optionally when
   Souls reach the 1.8e308 cap — Gluttony goes berserk and devours everything: full reset of
   Phases 2–4 for **Sin Essence** (the IP analog; gain scales with pre-frenzy Souls/Hunger —
   SPEC §6). Big `The Gluttony skill has awakened. Sin Essence +X.` notification.
2. **Devourer Rank:** E → D → C → B → A → S. Thresholds on cumulative Sin Essence; each rank
   grants a global multiplier + unlocks content.
3. **Sin Essence shop:** permanent upgrades (more absorption, cheaper training, higher hunger
   cap, starting Souls, faster Frenzy) — the "Infinity upgrades" board.
4. **Greed's Instincts (autobuyers):** auto-train stats, auto-feed (advance zones/kills),
   auto-Digest, auto-Awaken, auto-Feeding-Frenzy — each with a priority order (AD autobuyer
   priorities). Unlocked via Sin Essence / first Sin Trials.

**Verification checklist:**
- [ ] Maxing Hunger enables Feeding Frenzy; performing it grants Sin Essence and resets correctly.
- [ ] Sin Essence gain scales sensibly with the run; Rank multipliers persist through save/load.
- [ ] Autobuyers respect priority, never overspend, and toggle on/off.
- [ ] A full Frenzy → spend → faster-next-run loop is demonstrably faster each cycle.

**Anti-pattern guards:** Feeding Frenzy must NOT reset Sin Essence/Rank/shop (those are the
reward). Autobuyers inert until unlocked. Sin-Essence gain is a pure, unit-tested function.

---

## Phase 6 — Sin Trials (Challenges) + Skill Library + Appraisal

**Goal:** The reworked challenge system as **Sin Trials**, plus the collectible **Skills** and
**Appraisal** progression that define BoG builds.

**What to implement:**
1. `src/content/sins.ts` — 7 Deadly-Sin bosses (Wrath, Sloth, Lust, Pride, Envy, Greed,
   Gluttony): each has a `constraint` (a modifier active during the trial — e.g. "Hunger drains
   2× faster", "Greed locked to base form", "Appraisal disabled", "no Training"), a clear
   condition, and a **Sin Skill** reward (a permanent, build-defining modifier or autobuyer).
2. `src/engine/sinTrial.ts` — enter a trial (constrained sandbox run state), detect clear, grant
   the Sin Skill once. Mirrors AD challenge enter/complete; constraints pass through a
   `modifiers` context into `combat.ts`/`hunger.ts` (no `if(trial)` spaghetti in the engine).
3. **Skill Library** (`content/skills.ts` + `engine/skills.ts`): devoured enemies drop Skills;
   collect, **level** (re-devour same skill), and **equip** a loadout for passive bonuses.
4. **Appraisal** (`content/appraisal.ts`): a meta-upgrade track — spend a currency to reveal
   enemy stats/drop tables and **unlock higher-tier zones/prey**.
5. UI: Sin Trial list (lock/clear), Skill Library grid + loadout, Appraisal tree.

**Verification checklist:**
- [ ] Entering a Sin Trial applies its constraint via the modifiers context; exiting restores normal rules.
- [ ] Clearing grants the Sin Skill exactly once; re-entering doesn't double-reward.
- [ ] ≥3 distinct constraints produce genuinely different runs.
- [ ] Skills drop, level, and equip; equipped passives affect combat; survive save/load.
- [ ] Appraisal unlocks gate deeper zones as intended.

**Anti-pattern guards:** Constraints flow through a `modifiers` object, not engine `if`s. Trial
sandbox state never leaks into the main save. Skill effects are data-driven, not hardcoded in UI.

---

## Phase 7 — Mortal Sin Awakening (Prestige Layer 2) + break_eternity swap

**Goal:** Deeper prestige (AD Eternity analog): become a **Mortal Sin holder**, reset for
**Sins** currency and a permanent tree, and unlock **Gluttony's second personality**. Numbers
now span multiple layers — swap the big-number lib.

**What to implement:**
1. **Swap `break_infinity.js` → `break_eternity.js`** (drop-in via `decimal.ts`). Then audit
   every `.log10()/.log()/.ln()` call site — they now return **Decimal**, not number (fix
   `skillEssenceGain` and any formatter). Run the full test suite to green BEFORE new content.
2. **Mortal Sin Awakening** (Eternity analog): at a Rank-S milestone, awaken as a Sin holder —
   reset Phases 2–5 for **Sins**; track `mortalSins`.
3. **Second-Personality tree** (Time-Study analog): a branching tree of permanent passives bought
   with Sins (mutually-exclusive branches force build choices — e.g. "Restraint: tame Hunger" vs
   "Indulgence: Hunger fuels DPS"). The "other voice" inside Gluttony as the framing.
4. Notify `You have become a Mortal Sin.` Bump save `version` + add `migrate` step.

**Verification checklist:**
- [ ] Post-swap: all Phase 1–6 tests still pass; numbers past 1e308 display correctly.
- [ ] `grep -rn "\.log10\|\.log(\|\.ln(" src` — every hit handles a Decimal return.
- [ ] Mortal Sin reset grants Sins, resets lower layers, keeps the tree (SPEC §4).
- [ ] Tree branches are mutually exclusive where intended; respec works if offered.

**Anti-pattern guards:** Swap + green tests FIRST, then build the tree. Don't forget save
migration. Keep the Sins gain a pure tested function.

---

## Phase 8 — Transcendence / God's Domain (Prestige Layer 3, meta) + Titles/Achievements

**Goal:** The top meta-layer (AD Reality analog): reset *everything* for permanent,
build-defining perks and a currency that persists across all future runs.

**What to implement:**
1. **Transcendence:** unlock at a Mortal-Sin milestone. Resets all prior layers for **Divinity**
   (Reality-machine analog) + a roll/choice of permanent **Domain Perks** (glyph analog).
2. **Domain Perk tree / loadout:** persistent meta-upgrades bought with Divinity that make every
   subsequent run start stronger (the payoff for resetting the whole game).
3. **Titles & Achievements:** surfaced throughout (BoG titles: "Mad Glutton" → "Heavenly Dragon
   Slayer" → "God"); achievements grant small permanent multipliers (AD achievement mults).
4. Endgame pacing/balance first pass across all layers.

**Verification checklist:**
- [ ] Transcendence resets all layers but Divinity + perks persist forever (SPEC §4).
- [ ] A second Transcendence is meaningfully faster than the first.
- [ ] Achievements/titles unlock at the right conditions and apply bonuses.
- [ ] Full save/load round-trip across ALL layers with no data loss.

**Anti-pattern guards:** No non-meta currency survives Transcendence. Keep ONE authoritative
reset-scope table (SPEC §4) and obey it.

---

## Phase 9 — Status-Window UI / UX Polish (the Gluttony soul)

**Goal:** Make it *feel* like the manga. The status-window presentation is the identity.

**What to implement:**
1. **`[Appraisal]` notification queue:** animated status-window popups for every event
   (`Skill 'Gluttony' devoured the enemy. STR +X, AGI +Y.`, rank up, Sin Skill gained, title).
2. **Status Window:** a proper character sheet (HP/Souls, all 6 stats with absorbed-vs-trained
   breakdown, Devourer Rank badge, current Title, Greed form, Hunger bar) — numbers count-up animate.
3. **Hunger bar** front-and-center with a danger pulse near max; **Feeding Frenzy** screen-shake/flash.
4. **Quest log** framing ("a quest has arrived") wrapping the next-prestige goals (cosmetic over
   real unlock conditions). Optional "Ding!" SFX, devour flash.
5. Settings: notation toggle, autosave interval, offline-progress on/off, hard-reset (confirm).

**Verification checklist:**
- [ ] Every prestige/devour/unlock event produces a popup (walk a full run manually).
- [ ] Status Window values match engine state exactly (no display drift).
- [ ] No layout jank when many popups queue; Hunger bar tracks state live.
- [ ] Settings persist and actually change behavior.

**Anti-pattern guards:** Animations off CSS/refs, not the 60fps tick. Quest text derives from the
same source as real unlock conditions (no desync).

---

## Phase 10 — Verification, Balancing & Release Prep (FINAL)

1. **Anti-pattern grep gauntlet (SPEC §7)** clean (or justified exceptions).
2. **Full test suite green**; add an end-to-end "play 50,000 ticks with all autobuyers" sim
   asserting the player advances through ≥1 of each prestige layer.
3. **Balance pass:** target pacing — first Feeding Frenzy (minutes), first Mortal Sin (an
   evening), first Transcendence (hours). Tune constants in `src/content/*` only.
4. **Save migration test:** an old-version save loads under the current version without loss.
5. **Offline progress:** close N minutes → reopen → capped, correct Hunger + kills catch-up.
6. **Build + deploy:** `npm run build`; smoke-test `dist/`; optionally deploy (GitHub Pages/itch.io).

**Verification checklist:** all boxes checked; a fresh player reaches Transcendence without dev
tools; no console errors across a full playthrough.

---

## Build Order Summary

| Phase | Deliverable                                       | The feeling of…          |
| ----- | ------------------------------------------------- | ------------------------ |
| 0     | API/anti-pattern reference (done)                 | safe big-number math     |
| 1     | Scaffold + loop + Decimal + save                  | "it runs"                |
| 2     | Combat & Devour engine + Training + Frenzy        | devour, numbers compound |
| 3     | Hunger + Zones + Digest/Awaken resets             | tension + reset-for-power|
| 4     | Greed the sword (form ladder, blood cost)         | power at a price         |
| 5     | Feeding Frenzy prestige + autobuyers              | first real prestige      |
| 6     | Sin Trials + Skill Library + Appraisal            | builds & variety         |
| 7     | Mortal Sin Awakening + break_eternity swap        | deep prestige            |
| 8     | Transcendence meta-layer + titles                 | endgame                  |
| 9     | Status-window popups + Hunger bar polish          | the manga soul           |
| 10    | Verify, balance, ship                             | done                     |

**To execute:** open a fresh chat per phase, paste that phase's section, and build it. Start
with Phase 1.
