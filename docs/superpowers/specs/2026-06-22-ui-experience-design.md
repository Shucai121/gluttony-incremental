# Berserk of Gluttony — UI & Onboarding Experience Design

**Date:** 2026-06-22
**Status:** Approved (brainstorming)
**Supersedes:** `docs/superpowers/plans/2026-06-22-ui-overhaul.md` (stale — written against Phase-1 state, references game fields that were never built).

## Problem

Codex built a working game UI through Phase 3 (combat/devour, hunger, zones, in-run resets), but the experience has four gaps:

1. **No introduction.** A new player lands on a wall of panels with no idea what to do.
2. **No tooltips.** Resources, stats, and actions are unexplained.
3. **Everything shows at once.** All four panels (Status, Enemy, Gluttony, Training) render from first load — overwhelming.
4. **Wrong theme.** It is styled sci-fi *blue* (`#2b6cb0`), not Berserk-of-Gluttony.

## Goal

Restyle and restructure the existing UI into a **crimson LitRPG hybrid** "skill status window" that introduces itself, explains itself on hover, and **reveals systems progressively** as the player earns them — using the **Gluttony skill's inner voice** as the connective narrator for the intro, the unlock moments, and the tooltips.

## Approved Decisions

- **Theme:** Crimson LitRPG hybrid — dark-fantasy crimson/obsidian/bone palette *and* the genre's "skill status window" framing (corner-bracket `[ TITLE ]` headers, SKILL-ACQUIRED toasts), with the Gluttony inner-voice (`『 … 』`) narrating.
- **Onboarding:** One-time lore modal (the skill awakens; the kill→devour→grow loop) **plus** a persistent, subtle skill-voice "next objective" nudge that updates as the player progresses.
- **Progressive reveal:** **Hidden until earned** — unbuilt/un-reached systems are completely absent; the UI grows in place. No locked teasers, no tab rail.
- **Tooltips:** Hover **and** keyboard-focus, every resource/stat/action, mechanic line + a line of Gluttony-voice flavor.
- **Approach:** Stylesheet + focused components + a single reveal predicate (the recommended "B"), plus two flourishes folded in: a **Hunger blood-meter** and a **skill-acquired toast** when a system reveals.

## Important Context

- **Combat is idle.** There is no attack button; the player's DPS auto-kills the current foe and Souls tick up. Onboarding copy teaches "your hunger devours automatically; spend Souls to grow," not "click to attack."
- **Game save is SPEC-frozen.** `GameState` / `defaultState()` must not change. All onboarding/UI state lives in a **separate `gluttony.ui`** localStorage key.
- **Engine math is `Decimal` (`break_infinity.js`).** Currencies/stats are `Decimal` (`souls`, `totalKills`, `gluttonyLevel`, `awakenings`); `hunger`/`hungerMax`/`zone`/`maxZone` are bounded JS numbers. Never use JS `+ - * < >` on Decimals — use `.add/.mul/.gte` etc. UI only *reads* results via `format()`.

## Architecture

Pure logic (unit-tested) is separated from React (build-gated). New files under `src/ui/`:

### Logic modules (pure, unit-tested)

- **`src/content/ui.ts`** — `REVEAL` threshold constants (`Decimal`), tuned later. Single place for reveal numbers.
- **`src/ui/reveal.ts`** — *single source of truth for visibility.*
  - `export type Panel = "foe" | "status" | "training" | "zone" | "gluttony"`
  - `export const PANELS: readonly Panel[]`
  - `export function isRevealed(panel: Panel, state: GameState): boolean` — reads only **monotonic** fields (`totalKills`, `gluttonyLevel`) so a panel never un-reveals after souls are spent.
  - `export const REVEAL_COPY: Record<Panel, string>` — the skill-voice line shown when a panel newly reveals.
- **`src/ui/nudge.ts`** — `export function nextObjective(state: GameState): string | null` — the first unmet milestone's skill-voice objective; `null` when none remain.
- **`src/ui/tooltips.ts`** — `export interface TooltipCopy { title: string; body: string }`, `export const TOOLTIPS: Record<string, TooltipCopy>`, `export function getTooltip(id: string): TooltipCopy | null`.
- **`src/ui/uiPrefs.ts`** — `export interface UiPrefs { welcomeSeen: boolean; seenReveals: string[]; hintsSeen: string[] }` + `defaultUiPrefs`, `parseUiPrefs`, `serializeUiPrefs`, `loadUiPrefs`, `saveUiPrefs` (separate `gluttony.ui` key, defensive parsing).

### React components (build-gated)

- **`src/ui/styles.css`** — all theme tokens, panel/button/meter/tooltip/modal/toast classes, reveal fade animation. Replaces inline styles + blue palette.
- **`src/ui/Tooltip.tsx`** — hover/focus wrapper around any child, content from `getTooltip(id)`.
- **`src/ui/HungerBar.tsx`** — reusable blood-meter (`value`/`max` numbers).
- **`src/ui/useUiPrefs.ts`** — Zustand store wrapping `uiPrefs` with `dismissWelcome()`, `markRevealSeen(id)`, `markHintSeen(id)`; persists on every mutation.
- **`src/ui/SkillToast.tsx`** — transient "SKILL ACQUIRED" toast.
- **`src/ui/WelcomeModal.tsx`** — one-time lore modal (`onBegin`).
- **`src/ui/ObjectiveNudge.tsx`** — persistent skill-voice objective line.
- **Panel components** extracted from today's `StatusWindow`, restyled: `FoePanel.tsx`, `StatusPanel.tsx`, `TrainingPanel.tsx`, `ZonePanel.tsx`, `GluttonyPanel.tsx`.
- **`src/ui/AppShell.tsx`** — composes the panels (each gated by `isRevealed` with a fade-in), the resource header, modal, nudge, and toast host. Replaces `StatusWindow.tsx` (deleted); `App.tsx` renders `<AppShell />`.

## Progressive Reveal Mapping

| Panel | Revealed when | Reveal toast (skill-voice) |
|---|---|---|
| `foe` | always | — |
| `status` | always | — |
| `training` | `totalKills.gte(REVEAL.trainingKills)` (1) | "Strength can be devoured. Spend." |
| `zone` | `totalKills.gte(REVEAL.zoneKills)` (10) | "This prey is beneath you. Hunt deeper." |
| `gluttony` | `totalKills.gte(REVEAL.gluttonyKills)` (50) | "The skill deepens. Digest what you are." |

`foe`/`status` carry no toast (the welcome modal introduces them). Future Phase 4–6 systems (Greed, Sin Trials, Skills) are simply absent until built.

## Objective Nudge Sequence

`nextObjective` returns the first matching line (else `null`):

1. `totalKills.lt(1)` → "Let your hunger devour the foe before you."
2. `souls.gt(0)` and no stat trained yet (`STAT_ORDER.every(s => state.stats[s].trained.eq(0))`) → "Spend Souls — devour Strength into your own."
3. `totalKills.lt(REVEAL.zoneKills)` → "Cull more prey to open the path deeper."
4. `maxZone < 1` → "Hunt deeper. Advance a zone."
5. `gluttonyLevel.lt(1)` and `totalKills.gte(REVEAL.gluttonyKills)` → "The skill strains to deepen. Digest."
6. otherwise → `null`.

## Theme Tokens

`--bg #0a0608`, `--panel #160a0d`, `--panel-2 #1d0d11`, `--border #b3122c` (blood), `--accent #e23a4e` (ember), `--ember #ff5a3c`, `--text #e8dcc8` (bone), `--muted rgba(232,220,200,.55)`, `--glow 0 0 18px rgba(226,58,78,.35)`. Monospace font. The blue palette in `index.html` body and `StatusWindow` inline styles is removed.

## Persistence & Testing

- **Persistence:** onboarding/UI state in the separate `gluttony.ui` key via `useUiPrefs`; game save untouched.
- **Tests:** unit suites for `reveal.ts`, `nudge.ts`, `tooltips.ts`, `uiPrefs.ts` (node, pure — no DOM). Components verified by `npm run build`. The existing 14 engine tests stay green.
- **Two gates per task:** logic tasks pass `npm test`; every task keeps `npm run build` green (strict TS, `noUnusedLocals`/`noUnusedParameters`).
