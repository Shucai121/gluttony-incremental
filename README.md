# Berserk of Gluttony — Incremental (working title)

An idle/incremental game on the *Antimatter Dimensions* reset skeleton with a **Berserk of
Gluttony** engine: grow by **devouring what you kill** (stealing stats + skills) while a
**Hunger** meter threatens to consume you, and the sword **Greed** trades your blood for power.

## Docs (read in this order)
- **`HANDOFF.md`** — kickoff brief for the implementing agent (paste-to-Codex block + checkpoints).
- **`PLAN.md`** — phased narrative plan (what/why per phase, Phase 0 → 10).
- **`SPEC.md`** — binding engineering contracts (state shape, reset-scope table, formulas,
  balance constants). **SPEC wins on any conflict with PLAN.**

## Scaffold status
This repo already contains a compiling **Phase 1 foundation** (build config + the shared-contract
engine files + canonical state + a placeholder Status Window + tests). Phases 2+ build on it.

## Run
```bash
npm install      # if break_infinity.js fails to resolve, run: npm i break_infinity.js@latest
npm run test     # vitest — should be green
npm run dev      # http://localhost:5173 — shows the Status Window, ticks incrementing
npm run build    # typecheck (tsc) + production build to dist/
```

## What's wired in the scaffold
- `src/engine/decimal.ts` · `loop.ts` · `save.ts` — **shared contracts; copy/extend, don't rewrite.**
- `src/engine/format.ts` — number formatter (scientific / engineering).
- `src/state/types.ts` — the canonical `GameState` (target shape for all phases).
- `src/state/store.ts` — `defaultState()`, `migrate()`, `deepMerge()`, and the render store.
- `src/engine/game.ts` — the live state + fixed-timestep tick + autosave. **Phase 2 adds
  combat/devour/hunger inside `tick()`.**
- `src/content/enemies.ts` — placeholder `spawnEnemy()` (Phase 2 swaps in SPEC §6 scaling).
- `src/ui/StatusWindow.tsx` — placeholder status panel.
- `test/scaffold.test.ts` — proves big-number math, formatting, and save round-trip.
