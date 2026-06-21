# HANDOFF.md — Kickoff Brief for Codex

Paste the block below to Codex as its first instruction. Everything it needs is in this repo
folder (`PLAN.md`, `SPEC.md`, this file).

---

## ▶ Paste this to Codex

> You are building an incremental/idle web game: a **Berserk of Gluttony**-style game on the
> *Antimatter Dimensions* reset skeleton. Core fantasy: the cursed skill **Gluttony** — you
> grow by **devouring what you kill** (stealing their stats and skills) while a **Hunger** meter
> threatens to consume you; the sword **Greed** trades your blood for power. Design direction:
> **B — Devour Engine**; challenges are **Sin Trials**. The full design is in **`PLAN.md`**; the
> binding engineering contracts are in **`SPEC.md`**. If the two ever disagree, **SPEC.md wins**.
>
> **How to work:**
> 1. Read `SPEC.md` in full, then `PLAN.md`. Do not start coding until you've read both.
> 2. Implement **one phase at a time, in numeric order** (Phase 1 → 10). Do not begin a phase
>    until the previous phase's *Verification checklist* (in PLAN.md) is fully green.
> 3. A phase is **Done** only when: its checklist passes, `npm run test` passes, `npm run build`
>    passes, and the §7 grep gauntlet in SPEC.md is clean (or exceptions are justified).
> 4. Commit after each phase: `git commit -m "phase-N: <summary>"`.
> 5. Obey the hard rules from SPEC §0: **(a)** every currency/cost/stat/HP/DPS is a `Decimal`,
>    never a JS number (only `hunger` is a bounded JS number — SPEC §0/§2); **(b)** never use JS
>    `+ - * / > <` on Decimals — use `.add/.mul/.gt` etc.; **(c)** all balance constants live in
>    `src/content/*`, never inline; **(d)** all reset logic lives in `src/engine/reset.ts` and
>    obeys the reset-scope table (SPEC §4); **(e)** all DPS/Souls math folds into ONE
>    `computeDps`/`soulsPerKill` — never scatter multipliers or put combat math in the UI.
> 6. Use the copy-ready stubs in SPEC §2 verbatim (`decimal.ts`, `loop.ts`, `save.ts`). Use the
>    canonical `GameState` shape from SPEC §3 and the balance table in SPEC §6.
> 7. Don't add features that aren't in the plan. Don't change the tech stack
>    (TypeScript + Vite + React + Zustand + Vitest + break_infinity.js).
> 8. If a genuine ambiguity blocks you, pick the simplest option that satisfies the phase
>    checklist, note the assumption in your commit message, and continue.
>
> **Start now with Phase 1** (scaffold, Decimal core, game loop, save system). When Phase 1's
> checklist is green and tests/build pass, report back with: what you built, the checklist
> status, and any assumptions — then continue to Phase 2.

---

## For the human (you / PM)

- **Checkpoint cadence:** Phases 1, 2, 5, and 7 are the risky ones — review after each.
  - Phase 1: confirm `new Decimal("1e500").add("1e500")` works and saves round-trip (foundation).
  - Phase 2: the combat/devour engine — confirm **absorption compounds** (idling raises stats
    without training) and Souls/sec climbs as you descend the enemy queue. This is the core loop;
    if it doesn't feel good here, everything downstream inherits the problem.
  - Phase 5: first full prestige loop — confirm a second run is *faster* than the first.
  - Phase 7: the `break_infinity → break_eternity` swap — confirm all prior tests still pass and
    every `.log10()/.log()/.ln()` call site was audited (return type changed to Decimal); plus
    save/load across all layers.
- **If Codex drifts** (JS math on Decimals, scattered balance numbers, duplicated reset logic, or
  combat math creeping into the UI), point it back to SPEC §0 and the §7 grep gauntlet.
- **Balance is deliberately deferred to Phase 10.** Don't bikeshed the numbers in SPEC §6 early;
  they're starting points so Codex never has to guess. The thing to *feel-test* early is Phase 2's
  devour loop, not the exact constants.
