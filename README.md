# Berserk of Gluttony — Incremental (working title)

An idle/incremental game on the *Antimatter Dimensions* reset skeleton with a **Berserk of
Gluttony** engine: grow by **devouring what you kill** (stealing stats + skills) while a
**Hunger** meter threatens to consume you, and the sword **Greed** trades your blood for power.

## Docs (read in this order)
- **`HANDOFF.md`** — kickoff brief for the implementing agent (paste-to-Codex block + checkpoints).
- **`PLAN.md`** — phased narrative plan (what/why per phase, Phase 0 → 10).
- **`SPEC.md`** — binding engineering contracts (state shape, reset-scope table, formulas,
  balance constants). **SPEC wins on any conflict with PLAN.**

## Status — feature-complete (Phases 1–10)
The full game loop is implemented and tested. Numbers use **break_eternity.js**. The prestige
stack, top to bottom:

1. **Digest / Awaken** — in-run resets that raise the Gluttony multiplier.
2. **Feeding Frenzy** — full reset for **Sin Essence** → Devourer Rank (E→S), an essence shop,
   and Greed's-Instinct autobuyers.
3. **Sin Trials / Skill Library / Appraisal** — constrained sandboxes for build-defining Sin
   Skills; absorbed skills; zone-depth gating.
4. **Mortal Sin Awakening** — reset Phases 2–5 for **Sins** and the "Other Voice" tree.
5. **Transcendence (God's Domain)** — reset everything for **Divinity**, permanent **Domain
   Perks**, plus **Achievements** (permanent multipliers) and **Titles** (cosmetic).

A status-window UI ties it together: an `[Appraisal]` notification feed, a character sheet, a
danger-pulsing Hunger bar, prestige flashes, and a settings panel (notation, autosave, offline
progress, hard reset). **Offline progress** catches up the time the tab was closed (capped 8h).

## Run
```bash
npm install
npm run test     # vitest — full suite green
npm run dev      # http://localhost:5173
npm run build    # typecheck (tsc) + production build to dist/
```

## Verification & balance
- `test/simRun.test.ts` runs the engine unattended through the Digest → Feeding Frenzy loop.
- `test/offline.test.ts` covers bounded offline catch-up.
- **Balance is a conservative first pass.** Early pacing lands in the "minutes to first Frenzy"
  target, but deep-game pacing (Mortal Sin, Transcendence) and overall feel are **playtest-pending**
  — tune constants in `src/content/*` only. This was verified headlessly (build + types + unit
  tests); a real browser walkthrough is the remaining sign-off.

## Architecture contracts (don't rewrite)
- `src/engine/decimal.ts` · `loop.ts` · `save.ts` — shared primitives.
- `src/engine/step.ts` — `stepEngine()`, the single per-tick sequence shared by the live loop,
  offline catch-up, and the sim.
- `src/engine/combat.ts` — the **single source** for `computeGlobalMult` / `computeDps`; every
  multiplier folds in here, never scattered.
- `src/state/types.ts` / `store.ts` — canonical `GameState`, `defaultState`, `migrate`, `deepMerge`.
