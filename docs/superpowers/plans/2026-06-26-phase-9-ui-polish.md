# Phase 9 — Status-Window UI / UX Polish (the Gluttony soul)

**Branch:** `phase-9-ui-polish` · **Workflow:** TDD where logic is pure; presentational
components gated by `npm run build`. Commit `phase-9: …` per track.

PLAN §Phase 9. **Anti-pattern guards (obey):** animations live in CSS/refs, never the 60fps
tick; "quest"/notification text derives from the SAME source as real engine events (no desync);
no display drift (Status Window reads `game.state` directly).

This phase is UI-heavy — fewer pure tests than recent phases, more build-gated components.

---

## Track A — Event bus + describe (pure, fully tested)

- `engine/events.ts`: discriminated union `GameEvent`
  (`rank-up{rank}`, `skill-gained{name}`, `achievement{name}`, `title{name}`,
  `sin-skill{name}`, `prestige{layer,gain?}` where layer ∈ digest|awaken|frenzy|mortal-sin|transcend).
  Tiny synchronous bus: `emit(e)`, `subscribe(fn): () => void` (returns unsub),
  `_resetListeners()` for tests. `describeEvent(e): { tag: string; text: string }` — pure
  `[Appraisal]`-style copy per type.
- **Test** `test/events.test.ts`: subscriber receives emitted events; unsub stops delivery;
  describeEvent returns sensible tag+text for every variant.

## Track B — Engine emissions at action boundaries (tested via subscribe)

Emit only discrete milestone events (never per-kill spam):
- `reset.ts` `digest`/`awaken` → `prestige` (digest/awaken); `feedingFrenzy` → capture
  devourerRank before/after, emit `rank-up` on change, then `prestige{frenzy, gain}`.
- `mortalSin.ts` `mortalSinAwaken` → `prestige{mortal-sin, gain}`.
- `transcendence.ts` `transcend` → `prestige{transcend, gain}`.
- `skills.ts` `dropSkill` → `skill-gained` only on NEW acquisition (level 0→1).
- `sinTrial.ts` `checkTrialClear` → `sin-skill{reward}` on clear.
- `game.ts` `tick` → emit `achievement`/`title` from `checkAchievements`/`checkTitles` fresh lists.
- **Test** `test/eventEmissions.test.ts`: feedingFrenzy/digest/transcend/dropSkill(new)/trial-clear
  each emit the expected event to a subscriber.

## Track C — Notification queue + drama (presentational, build-gated)

- `ui/Notifications.tsx`: subscribes to the bus on mount, holds a capped (≤4) list in
  `useState`, each entry self-expires via `setTimeout` ref (NOT the tick). Renders
  `[Appraisal]`-framed cards using `describeEvent`. Mounted in AppShell.
- CSS: `notification-in` slide/fade; `HungerBar` gains a `danger` pulse class when
  `ratio >= 0.85`; a `feeding-frenzy-flash` overlay class. AppShell flashes on the frame
  `hunger >= hungerMax` (ref-guarded, CSS animation).
- Extract the queue-cap reducer as a pure `pushCapped(list, item, cap)` helper and **test** it.

## Track D — Status Window + Settings (build-gated + format test)

- `format.ts`: module-level `currentNotation` with `setNotation(n)`; `format`'s default
  notation reads it — so every existing `format(x)` call respects the setting with no churn.
- `game.ts`: on load, `setNotation(state.settings.notation)`.
- `ui/StatusPanel.tsx` → full character sheet: Souls, DPS, all 6 stats with trained-vs-absorbed
  split (absorbed = value − trained − base), Devourer Rank badge (`rankName`), active Title,
  Greed form name, Hunger bar. Reads `game.state` directly (no drift).
- `ui/SettingsPanel.tsx`: notation select (calls `setNotation` + writes settings),
  autosave-interval input, offline-progress toggle, Hard Reset (confirm) moved here from Status.
  Reveal-gated `settings` panel (always revealed). Tooltips + AppShell registration.
- **Test** `test/format.test.ts` (extend or new): `setNotation("engineering")` changes
  `format` output; round-trips back.

## Final gate

Full suite green · `npm run build` clean · §7 grep gauntlet clean (no scattered mults; no
`if(activeTrial)`; format single-source). Update memory. Push branch; user authorizes merge.
