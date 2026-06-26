# Phase 7 — Mortal Sin Awakening (Prestige Layer 2) + break_eternity swap

> Binding: SPEC.md (§2 stubs, §4 reset-scope Mortal Sin column, §5 versioning, §6 prestige gains/globalMult, §7 grep). Branch `phase-7-mortal-sin` off main.
> SPEC mandate: **do the library swap first and get the FULL suite green before any new content.**

## Track A — break_eternity swap (do first, green before content)

Audit surface (only 3 files touch library internals):
- `prestige.ts:6` `souls.max(1).log10()` → now returns Decimal; use `.toNumber()` (run size is bounded, fits a JS number).
- `training.ts:16` `estimateSource.log10() / mult.log10()` → `estimateSource.log10().div(mult.log10()).toNumber()`.
- `format.ts` uses `.exponent`/`.mantissa` → guard: if `!Number.isFinite(exp)` or `|exp|` beyond a sane bound, fall back to `value.toString()` (break_eternity's native notation handles all layers).

### Task A1: swap the library
- `npm i break_eternity.js`; `decimal.ts` import `break_eternity.js` instead of `break_infinity.js`. Keep the same exports/`D`/`ZERO`/`ONE`/`geometricCost`.
- Fix the 3 audit sites above.
- `grep -rnE "\.log10\(|\.log\(|\.ln\(" src` — every result either operates on Decimals or ends in `.toNumber()`.
- **Run `npm test` — ALL green** (precision parity check). Then `npm run build`. Commit `phase-7: swap break_infinity -> break_eternity and audit log sites`.

## Track B — Mortal Sin Awakening (engine)

### Task B1: `content/mortalSin.ts` + `engine/mortalSin.ts`
- Content: `MORTAL_SIN_RANK = 5` (index of "S").
- Engine consumes §4 Mortal Sin column + §6 `sinsGain = floor(sinEssence^0.5)`:
  - `canMortalSin(state)` = `devourerRank >= MORTAL_SIN_RANK`.
  - `mortalSinGain(state)` = `state.sinEssence.sqrt().floor().max(0)`.
  - `mortalSinAwaken(state): Decimal` — if !can, return ZERO. Else: `resetRun`; CLEAR gluttonyLevel, awakenings, `greed = {form:0,bloodCharge:ZERO}`, `sinEssence=ZERO`, `devourerRank=0`, `essenceUpgrades={}`; KEEP autobuyers/sinTrials/skills/appraisal/sinTree; `sins += gain`; `mortalSins += 1`. Return gain.
- Test `test/mortalSin.test.ts`: gated on rank S; awaken banks `floor(sqrt(sinEssence))` sins, +1 mortalSins, clears sinEssence/rank/essenceUpgrades/run, keeps skills+sinTree.

## Track C — Sins second-personality tree (engine, folds into globalMult)

### Task C1: `content/sinTree.ts` + `engine/sinTree.ts`
- Content: `SinTreeNode { id; name; description; branch: "restraint"|"indulgence"; cost: Decimal; requires: string|null; mult: Decimal }`; `SIN_TREE` (2 branches × 2 nodes, escalating cost/mult); `sinTreeNodeById`.
- Engine: `ownsNode(state,id)`; `committedBranch(state)` = branch of any owned node, else null (mutual exclusivity); `canBuyNode(state,id)` (branch not foreclosed, `requires` owned, affordable in Sins, not already owned); `buyNode(state,id)` (spend Sins, set `sinTree[id]=true`); `sinTreeMult(state)` = product of owned nodes' `mult`.
- `combat.ts computeGlobalMult`: `.mul(sinTreeMult(state))` (§6 — sinTreeMult belongs in globalMult).
- Test `test/sinTree.test.ts`: buy gated on Sins + prereq; picking one branch forecloses the other; `sinTreeMult` reflects owned nodes and folds into `computeGlobalMult`.

## Track D — UI + persistence + reveal

### Task D1: save version bump (`state/store.ts`)
- `SAVE_VERSION = 2`; `migrate` adds a `case 1 -> 2` step (identity beyond setting version; all fields already in defaultState). Keep future-version guard.
- Extend `test/save.test.ts`: a hand-written `version:1` save (with sins/mortalSins/sinTree) loads under v2 without loss.

### Task D2: `ui/MortalSinPanel.tsx` + `ui/SinTreePanel.tsx`, reveal + register + tooltips
- MortalSinPanel: Sins, Mortal Sins, projected gain, Mortal Sin Awaken button (`canMortalSin`).
- SinTreePanel: branches with node buttons (cost in Sins, locked when foreclosed/unaffordable), committed-branch readout.
- `reveal.ts`: `Panel`/`PANELS` gain `"mortalsin" | "sintree"`; reveal `mortalsin` when `devourerRank >= MORTAL_SIN_RANK || mortalSins.gt(ZERO)`; `sintree` when `mortalSins.gt(ZERO) || sins.gt(ZERO)`. REVEAL_COPY + tooltips. Register in AppShell.
- Extend `test/reveal.test.ts`.

### Task D3: Final gate
- `npm test` green, `npm run build` clean, §7 grep gauntlet clean. Update memory. Merge decision to user.

## Planner decisions (SPEC silent)
1. `mortalSinGain = floor(sqrt(sinEssence))` (= `^0.5`, SPEC §6).
2. Sin tree = 2 mutually-exclusive branches (Restraint/Indulgence), nodes give a global multiplier folded into `sinTreeMult` (Phase 7 keeps effects to a clean multiplier; richer passives deferred).
3. Greed is fully CLEARED (form→0) on Mortal Sin per §4; autobuyers/skills/appraisal/sinTrials/sinTree KEEP.
