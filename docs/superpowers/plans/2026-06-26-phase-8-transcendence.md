# Phase 8 — Transcendence / God's Domain (Prestige Layer 3) + Domain Perks + Achievements & Titles

**Branch:** `phase-8-transcendence` · **Workflow:** TDD (red→green per task), commit `phase-8: …` per task.

SPEC refs: §3 (state already declares `divinity/transcendences/perks/achievements/titles`),
§4 Transcendence reset column, §6 `gain = floor(log10(sins+1))`, §6 globalMult now
`… * perkMult * achievementMult`.

**No save-version bump:** every Phase-8 field already exists in `defaultState()` (store.ts),
so a v2 save deep-merges them in. SAVE_VERSION stays 2. (Add a round-trip test anyway.)

---

## Track A — Transcendence engine (the layer-3 reset)

- `content/transcendence.ts`: `TRANSCEND_MORTAL_SINS = D(2)` (unlock threshold, tunable).
- `engine/transcendence.ts`:
  - `canTranscend(state)` = `state.mortalSins.gte(TRANSCEND_MORTAL_SINS)`.
  - `divinityGain(state)` = `floor(log10(sins + 1))` (break_eternity `.add(1).log10().toNumber()` → floor → Decimal).
  - `transcend(state)`: obey §4 Transcendence column — `resetRun` + clear gluttonyLevel,
    awakenings, greed, sinEssence, devourerRank, essenceUpgrades, autobuyers, sinTrials,
    activeTrial, skills, appraisal, sins, mortalSins, sinTree; then `divinity += gain`,
    `transcendences += 1`. KEEP perks/achievements/titles/settings/divinity/transcendences.
- **Test** `test/transcendence.test.ts`: unlock gate; gain formula floor(log10(sins+1)); a
  transcend wipes layers 1–3 but keeps perks/achievements/titles + banks divinity; no-op below threshold.

## Track B — Domain Perks (permanent meta-upgrades bought with Divinity)

- `content/perks.ts`: `PerkDef { id; name; description; cost: Decimal; mult: Decimal }`; flat
  list (independently buyable, no branch exclusivity — this is the payoff layer):
  domain-power (cost 1, ×5), domain-greed (cost 3, ×10), domain-eternity (cost 10, ×100).
  `perkById(id)`.
- `engine/perks.ts`: `ownsPerk`, `canBuyPerk` (affordable + not owned), `buyPerk`,
  `perkMult(state)` = product of owned mults.
- **Test** `test/perks.test.ts`: divinity gate; buy deducts + latches; perkMult folds product;
  can't rebuy.

## Track C — Achievements & Titles (latch-on-check)

- `content/achievements.ts`: `AchievementDef { id; name; description; mult; check(state) }`;
  small permanent global mults, latched the first tick their condition holds (so transient
  conditions stick): first-digest (gluttony≥1, ×1.1), first-essence (sinEssence>0, ×1.15),
  rank-s (devourerRank≥5, ×1.25), first-mortal-sin (mortalSins>0, ×1.5),
  first-transcend (transcendences>0, ×2). `achievementMult(state)` = product of unlocked.
- `engine/achievements.ts`: `checkAchievements(state)` latches newly-met ids into
  `state.achievements`, returns newly-unlocked ids (for toasts); `achievementMult`.
- `content/titles.ts`: `TitleDef { id; name; description; check(state) }` — cosmetic only
  (NOT in globalMult per SPEC): mad-glutton (gluttony≥1), heavenly-dragon-slayer (devourerRank≥5),
  god (transcendences>0). `engine/titles.ts`: `checkTitles(state)` latches into
  `titles.unlocked[]`; `setTitle(state, id)` only if unlocked.

## Track D — integration, UI, persistence

- `combat.ts` `computeGlobalMult`: `.mul(perkMult(state)).mul(achievementMult(state))`.
- `game.ts` `tick`: after `tickCombat`, call `checkAchievements` + `checkTitles` (cheap latches).
- UI panels (reveal-gated, tooltips, AppShell registration):
  - `TranscendencePanel` — Divinity, Transcendences, next gain, Transcend button.
    reveal: `mortalSins.gte(TRANSCEND_MORTAL_SINS) || transcendences.gt(0)`.
  - `DomainPerkPanel` — buy perks. reveal: `divinity.gt(0) || transcendences.gt(0)`.
  - `AchievementsPanel` — list unlocked/locked. reveal: any unlocked.
  - `TitlesPanel` — unlocked titles + set-active. reveal: any unlocked.
- **Test** `test/reveal.test.ts`: phase-8 panel reveal gates.
- **Test** `test/save.test.ts`: round-trip divinity/transcendences/perks/achievements/titles.

## Final gate (D-last)

Full suite green · `npm run build` clean · SPEC §7 grep gauntlet clean (single-source
globalMult; no scattered mults; no `if(activeTrial)`). Update memory. Push branch; user
authorizes main merge.
