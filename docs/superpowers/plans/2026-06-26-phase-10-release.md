# Phase 10 — Verification, Balancing & Release Prep (FINAL)

**Branch:** `phase-10-release` · **Workflow:** TDD where logic is pure. Commit `phase-10: …`.

PLAN §Phase 10. Goal: prove the whole stack holds together, wire offline progress, sanity-check
pacing, and prep a deployable build.

---

## Track A — `stepEngine` extraction + Offline progress

- `engine/step.ts`: extract `stepEngine(state, deltaSec)` = the per-tick engine sequence
  (hunger → greed → combat → trial clear → autobuyers → achievements → titles emissions).
  `game.ts` `tick` calls it, then handles save. Removes duplication and gives offline/sim a
  single source of truth for "advance the world one step."
- `engine/offline.ts`: `applyOfflineProgress(state, elapsedSec, opts?)` — pure. When
  `state.settings.offlineProgress` and `elapsedSec > 0`, fast-forward in fixed steps up to a
  cap (`OFFLINE_CAP_SEC = 8h`), bounded step count. Returns seconds actually applied.
- `game.ts` boot: compute `elapsedSec = (Date.now() - state.lastSave)/1000`, call
  `applyOfflineProgress`. (No-op in tests since lastSave≈now.)
- **Test** `test/offline.test.ts`: catch-up advances kills/hunger; respects the cap; is a
  no-op when `offlineProgress` is off or elapsed ≤ 0.

## Track B — End-to-end 50,000-tick sim

- **Test** `test/simRun.test.ts`: fresh state with all 3 autobuyers unlocked+enabled; each step
  calls `stepEngine`, and triggers `feedingFrenzy` when `canFeedingFrenzy` (auto-frenzy stand-in
  for the player). After 50k ticks assert the player advanced through ≥1 prestige layer:
  `gluttonyLevel.gt(0)` (auto-digest fired) AND at least one Feeding Frenzy banked Sin Essence
  (devourerRank or a frenzy counter advanced). Guards the whole loop end to end.

## Track C — Balance sanity pass

- Use the sim to measure ticks-to-first-Frenzy and rank progression (20 ticks/sec → "minutes"
  ≈ a few thousand ticks). Tune `src/content/*` constants ONLY if clearly broken; document any
  change. Blind tuning without a live playtest is risky — prefer minimal, defensible nudges and
  flag remaining pacing to the user as playtest-pending.

## Track D — Save robustness + final gate + release prep

- **Test** `test/save.test.ts`: a hand-written minimal/old save deep-merges to a fully-populated
  current state (every field defaulted, no crash).
- Final §7 grep gauntlet clean; full suite green; `npm run build` clean; smoke-check `dist/`.
- README: brief "play / build" note. Update memory. Push branch; user authorizes merge.

## Out of scope / playtest-pending (call out to user)

A real browser walkthrough and fine-grained pacing tuning need a human at the keyboard — this
environment is headless. Phase 10 proves correctness and structural pacing; final feel is the
user's to confirm.
