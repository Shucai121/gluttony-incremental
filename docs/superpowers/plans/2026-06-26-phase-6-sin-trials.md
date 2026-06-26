# Phase 6 — Sin Trials + Skill Library + Appraisal Implementation Plan

> Binding contracts: **SPEC.md** (§3 state shape, §4 reset-scope, §6 balance, §7 grep). PLAN.md
> Phase 6 is the narrative. When they disagree, SPEC wins. Branch: `phase-6-sin-trials` (off main).

## Global Constraints

- TDD per task: write failing test → confirm red → implement → green → `phase-6:` commit.
- Balance constants live in `src/content/*.ts` only. No `1eN` literals in engine/ui.
- All currency math is `Decimal` (methods, never JS operators). `hunger`/zone indices stay JS numbers.
- Combat/hunger read constraints from ONE `modifiers` context — never `if (activeTrial)` in the engine.
- §4 reset-scope: `sinTrials(cleared)`, `skills`, `appraisal` are KEEP through Digest/Awaken/Frenzy/MortalSin; CLEAR only on Transcendence (Phase 8 — not built here, but `resetRun` already covers run-scope).

## Planner decisions (SPEC silent — chosen here)

1. **Skills affect DPS.** The `skillMult(state)` stub already multiplies `computeDps` (§2). Each
   equipped skill contributes `multPerLevel ^ level`. Data-driven, 3-slot loadout (`LOADOUT_SIZE`).
2. **Appraisal is bought with Sin Essence.** Persistent (KEEP through Frenzy) like the essence
   shop, but a *depth/reveal* board, not a multiplier board. Distinct purpose, shared currency.
3. **Appraisal gates zone depth beyond `APPRAISAL_FREE_ZONES = 5`.** Zones 0–4 stay free (don't
   retroactively block Phase 2–5 progression / existing tests). "Deep Sight" levels each grant
   `APPRAISAL_ZONES_PER_LEVEL` more reachable zones. `canAdvanceZone` AND-gates VIT and appraisal.
4. **A Sin Trial is a constrained sandbox run.** `enterTrial` sets `activeTrial` and `resetRun`s
   into a fresh run; constraints apply via `activeModifiers` while in the trial; `exitTrial`
   (manual or on clear) clears `activeTrial` and `resetRun`s again. Run-scope state resets on
   both edges, so nothing leaks into the main save. Reward (cleared flag + Sin Skill) is granted
   once on clear and is persistent.

## Task DAG

A (Skills): 1→2→3.  B (Appraisal): 4→5.  C (Trials): 6→7→8→9 (9 needs 2 for reward skills, 5 for appraisal-lock).
D (UI): 10,11,12 need their tracks; 13 needs 10–12. 14 gate last. A and B are independent.

---

### Task 1: Skill content + drop table (`content/skills.ts`)
- Produces: `SkillEffectKind = "dps"`; `SkillDef { id; name; description; kind; multPerLevel: Decimal; dropZone: number }`; `SKILLS: SkillDef[]`; `skillById(id)`; `skillDropForZone(zone): string | null` (returns the skill whose `dropZone === zone`, else null). `LOADOUT_SIZE = 3`.
- ~4 skills, dropZone 0..3, multPerLevel 1.1–1.25.
- Test: `skillById` round-trips; `skillDropForZone(0)` returns a real id; out-of-range → null.

### Task 2: Skill engine (`engine/skills.ts`)
- Consumes: `SKILLS`, `skillById`, `LOADOUT_SIZE`; `state.skills`.
- Produces: `skillLevel(state,id)`; `dropSkill(state,id)` (first drop = level 1 unequipped; re-drop = +1 level); `equippedCount(state)`; `isEquipped(state,id)`; `equipSkill(state,id): boolean` (false if not owned or loadout full); `unequipSkill(state,id)`; `skillMult(state): Decimal` (product of `multPerLevel^level` for equipped dps skills).
- Test: drop adds at lv1; re-drop levels up; equip respects `LOADOUT_SIZE`; `skillMult` reflects only equipped skills.

### Task 3: Wire drops into combat (`content/enemies.ts`, `engine/combat.ts`)
- `enemies.ts`: `spawnEnemy` sets `skillDropId = skillDropForZone(zone)` (deterministic per zone; Phase 6 keeps it simple — every enemy in a drop zone yields its skill).
- `combat.ts`: in `killEnemy`, if `current.skillDropId` then `dropSkill(state, current.skillDropId)`; replace the local `skillMult` stub with `import { skillMult } from "./skills"`.
- Test (append `test/skills.test.ts`): a kill in zone 0 grants the zone-0 skill; equipping it raises `computeDps` vs unequipped.

### Task 4: Appraisal content (`content/appraisal.ts`)
- Produces: `AppraisalKind = "depth" | "reveal"`; `AppraisalNode { id; name; description; kind; baseCost: Decimal; costMult: Decimal; maxLevel: number | null }`; `APPRAISAL: AppraisalNode[]`; `appraisalNodeById(id)`. Constants `APPRAISAL_FREE_ZONES = 5`, `APPRAISAL_ZONES_PER_LEVEL = 3`.
- Nodes: `deep-sight` (depth, baseCost 25 Sin Essence, mult 4), `predator-eye` (reveal, baseCost 10, mult 3, maxLevel 1).
- Test: ids resolve; `deep-sight` baseCost eq 25.

### Task 5: Appraisal engine (`engine/appraisal.ts`)
- Consumes: `APPRAISAL`, `appraisalNodeById`, `geometricCost`, `state.appraisal`, `state.sinEssence`.
- Produces: `appraisalLevel(state,id)`; `appraisalCost(state,id)` (`geometricCost(base,mult,level)`); `canBuyAppraisal`; `buyAppraisal` (spends Sin Essence, ++level); `appraisalZoneCap(state)` = `APPRAISAL_FREE_ZONES + APPRAISAL_ZONES_PER_LEVEL * level("deep-sight")`; `isAppraised(state)` = `level("predator-eye") > 0`.
- `engine/zones.ts`: AND `canAdvanceZone` with `nextZone <= appraisalZoneCap(state)`.
- Test: cost gating + spend; `appraisalZoneCap` default = 5; one `deep-sight` → 8; `advanceZone` blocked at zone 5→6 until `deep-sight` bought (with VIT high enough to isolate the appraisal gate). Re-run existing zone tests green.

### Task 6: Modifiers context (`engine/modifiers.ts`)
- Produces: `Modifiers { dpsMult: Decimal; absorbMult: Decimal; hungerRateMult: number; greedLocked: boolean; trainingLocked: boolean; appraisalLocked: boolean }`; `NEUTRAL_MODIFIERS`; `activeModifiers(state): Modifiers` — if `state.activeTrial` resolves to a sin, merge its `constraint` over neutral; else neutral.
- Test: no trial → neutral; a trial with `hungerRateMult: 2` surfaces 2.

### Task 7: Sin content (`content/sins.ts`)
- Produces: `SinDef { id; name; description; constraint: Partial<Modifiers>; clearKills: Decimal; rewardSkillId: string }`; `SINS: SinDef[]` (7: wrath/sloth/lust/pride/envy/greed/gluttony); `sinById(id)`. Each constraint uses a distinct lever (e.g. wrath `hungerRateMult: 2`, sloth `dpsMult: 0.5`, pride `greedLocked`, envy `trainingLocked`, gluttony `appraisalLocked`). `clearKills` = kills-in-trial to clear. `rewardSkillId` → a Sin Skill in `SKILLS` (add Sin Skills to Task 1 list, dropZone -1 = undroppable, trial-only).
- Test: 7 sins; ids resolve; every `rewardSkillId` resolves to a real skill.

### Task 8: Sin trial engine (`engine/sinTrial.ts`)
- Consumes: `SINS`, `sinById`, `resetRun`, `dropSkill`, `state.sinTrials/activeTrial/totalKills`.
- Produces: `isTrialUnlocked`/`isTrialCleared`; `canEnterTrial(state,id)` (not already in a trial); `enterTrial(state,id)` (`activeTrial=id`; record `trialStartKills`? — simpler: `resetRun` zeroes `totalKills`, so clear = `totalKills >= clearKills`); `checkTrialClear(state)` (if in trial and `totalKills >= sin.clearKills` → mark `cleared`, `dropSkill(reward)` once, `exitTrial`); `exitTrial(state)` (`activeTrial=null`, `resetRun`). Add a `trialStartKills: number`? No — use `resetRun` on enter so in-trial kills count from zero.
- Test: enter sets activeTrial + resets; reaching clearKills marks cleared once + grants reward + exits; re-enter a cleared trial doesn't double-grant (level stays).

### Task 9: Thread modifiers into engine (`combat.ts`, `hunger.ts`, `training.ts`, `greed.ts`, `appraisal.ts`, `game.ts`)
- `combat.ts computeDps`: `.mul(mods.dpsMult)`; `absorbRate`: `.mul(mods.absorbMult)` (via `activeModifiers(state)`).
- `hunger.ts tickHunger`: scale rate by `mods.hungerRateMult`.
- `training.ts buyTraining/buyMaxTraining`: no-op if `mods.trainingLocked`.
- `greed.ts advanceForm`: no-op if `mods.greedLocked`.
- `appraisal.ts buyAppraisal`: no-op if `mods.appraisalLocked`.
- `game.ts tick`: call `checkTrialClear(game.state)` after `tickCombat`.
- Test: each lock/mult observably changes the relevant function under an active trial; neutral when no trial.

### Task 10: SkillLibraryPanel (`ui/SkillLibraryPanel.tsx`)
- Grid of owned skills (name · Lv · effect), equip/unequip toggle honoring `LOADOUT_SIZE`, loadout count readout. Tooltips.

### Task 11: AppraisalPanel (`ui/AppraisalPanel.tsx`)
- Nodes with level + Sin Essence cost buttons (`canBuyAppraisal`), zone-cap readout. Tooltips.

### Task 12: SinTrialPanel (`ui/SinTrialPanel.tsx`)
- Trial list: locked/available/cleared; Enter button; active-trial banner with constraint text + clear progress; Abandon (exitTrial). Tooltips.

### Task 13: Reveal + nudge + register (`ui/reveal.ts`, `ui/nudge.ts`, `ui/AppShell.tsx`, `ui/tooltips.ts`)
- `Panel` union + `PANELS` gain `"skills" | "appraisal" | "trials"`; `isRevealed`: skills when any owned (`Object.keys(state.skills).length>0`), appraisal+trials when `sinEssence.gt(ZERO)` (post-first-Frenzy). `REVEAL_COPY` + tooltip entries. Register components in `PANEL_COMPONENTS`. Optional nudge line.
- Test (append reveal.test): skills hidden fresh, shown after a drop; appraisal/trials shown after sinEssence>0.

### Task 14: Final gate
- `npm test` green, `npm run build` clean, §7 grep gauntlet clean (only allowed matches). Update memory. Merge decision deferred to user.
