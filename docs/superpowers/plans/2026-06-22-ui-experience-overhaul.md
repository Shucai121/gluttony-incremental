# Berserk of Gluttony — UI & Onboarding Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle and restructure the existing Phase-3 game UI into a crimson "skill status window" that introduces itself, explains elements on hover/focus, and reveals systems progressively as the player earns them.

**Architecture:** A single pure predicate (`reveal.ts`) is the one source of truth for what is visible; the lore modal, the objective nudge, the reveal toasts, and every panel consult it. Pure logic (reveal, nudge, tooltips, prefs) is unit-tested; React components are build-gated. Visual theming moves from inline styles to one `styles.css`. Onboarding/UI state persists in a separate `gluttony.ui` localStorage key, never the SPEC-frozen game save.

**Tech Stack:** React 18 + TypeScript (strict), Vite 5, Zustand 4, Vitest 2 (node env), `break_infinity.js` Decimals.

## Global Constraints

- **Big numbers are `Decimal`** (`break_infinity.js`): `souls`, `totalKills`, `gluttonyLevel`, `awakenings`, stat `value`/`trained`, costs. Never use JS `+ - * / < >` on Decimals — use `.add/.mul/.gte/.eq/.lt/.gt`. `hunger`/`hungerMax`/`zone`/`maxZone` are bounded JS `number`s (normal arithmetic is fine).
- **UI reads results, never computes game math.** Components read `game.state`/`game.ticks` and call existing engine functions (`combatReadout`, `trainingCost`, etc.) and `format()`. No new combat/souls math in UI.
- **Never touch the game save.** `GameState`/`defaultState()` are frozen. All onboarding/UI state uses the separate `gluttony.ui` key via `uiPrefs.ts`.
- **Strict TS:** `noUnusedLocals`/`noUnusedParameters` are on — no unused imports or params.
- **Two gates:** logic tasks must pass `npm test`; every task must keep `npm run build` green.
- **One commit per task**, message prefix `feat:` / `style:` / `chore:`.
- **Palette (Crimson & Obsidian):** `--bg #0a0608`, `--panel #160a0d`, `--panel-2 #1d0d11`, `--border #b3122c`, `--accent #e23a4e`, `--ember #ff5a3c`, `--text #e8dcc8`, `--muted rgba(232,220,200,.55)`, `--glow 0 0 18px rgba(226,58,78,.35)`.
- **Skill-voice convention:** narrator lines are wrapped in `『 … 』`.

---

## File Structure

**Create (logic — unit-tested):**
- `src/content/ui.ts` — reveal threshold constants.
- `src/ui/reveal.ts` + `test/reveal.test.ts` — panel visibility predicate + reveal copy.
- `src/ui/nudge.ts` + `test/nudge.test.ts` — next-objective selector.
- `src/ui/tooltips.ts` + `test/tooltips.test.ts` — tooltip copy map.
- `src/ui/uiPrefs.ts` + `test/uiPrefs.test.ts` — UI prefs persistence (separate key).

**Create (React — build-gated):**
- `src/ui/styles.css`, `src/ui/Tooltip.tsx`, `src/ui/HungerBar.tsx`, `src/ui/useUiPrefs.ts`, `src/ui/SkillToast.tsx`, `src/ui/WelcomeModal.tsx`, `src/ui/ObjectiveNudge.tsx`
- `src/ui/FoePanel.tsx`, `src/ui/StatusPanel.tsx`, `src/ui/TrainingPanel.tsx`, `src/ui/ZonePanel.tsx`, `src/ui/GluttonyPanel.tsx`
- `src/ui/AppShell.tsx`

**Modify:** `src/main.tsx` (import stylesheet), `index.html` (recolor body), `src/App.tsx` (render `<AppShell />`).

**Delete:** `src/ui/StatusWindow.tsx`.

---

## Task 1: Theme stylesheet

**Files:**
- Create: `src/ui/styles.css`
- Modify: `src/main.tsx:1` (add stylesheet import)
- Modify: `index.html:8` (recolor body)

**Interfaces:**
- Consumes: nothing.
- Produces: CSS classes used by all later components: `.app-shell`, `.resourcebar`, `.resource`, `.panel`, `.panel__title`, `.row`, `.muted`, `.btn`, `.actions`, `.stat-grid`, `.stat-card`, `.meter`, `.meter__fill`, `.meter--full`, `.tip`, `.tip__pop`, `.tip__title`, `.tip__body`, `.modal__scrim`, `.modal`, `.modal__lore`, `.toast-host`, `.toast`, `.nudge`, `.reveal`, `.locked-hp`, `.hp`, `.hp__fill`.

- [ ] **Step 1: Create the stylesheet**

Create `src/ui/styles.css`:

```css
:root {
  --bg: #0a0608;
  --panel: #160a0d;
  --panel-2: #1d0d11;
  --border: #b3122c;
  --accent: #e23a4e;
  --ember: #ff5a3c;
  --text: #e8dcc8;
  --muted: rgba(232, 220, 200, 0.55);
  --glow: 0 0 18px rgba(226, 58, 78, 0.35);
  --radius: 10px;
  --gap: 14px;
  --font: ui-monospace, SFMono-Regular, Menlo, monospace;
}

* { box-sizing: border-box; }
html, body, #root { height: 100%; }
body { margin: 0; background: var(--bg); color: var(--text); font-family: var(--font); }

.app-shell {
  width: min(960px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 24px 0 64px;
  display: flex;
  flex-direction: column;
  gap: var(--gap);
}

.resourcebar {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  align-items: center;
  justify-content: center;
}
.resource { display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 96px; }
.resource > .muted { font-size: 11px; letter-spacing: 1px; text-transform: uppercase; }

.panel {
  position: relative;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--glow);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.panel__title {
  margin: 0 0 6px;
  letter-spacing: 3px;
  font-size: 14px;
  text-transform: uppercase;
}
.row { display: flex; justify-content: space-between; gap: 10px; font-variant-numeric: tabular-nums; }
.muted { color: var(--muted); }

.btn {
  font-family: var(--font);
  background: transparent;
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  transition: box-shadow 0.15s, border-color 0.15s, color 0.15s;
}
.btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); box-shadow: var(--glow); }
.btn:disabled { opacity: 0.4; cursor: not-allowed; }
.actions { display: flex; gap: 8px; }

.stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
.stat-card { border: 1px solid rgba(179, 18, 44, 0.4); border-radius: 8px; padding: 10px; display: grid; gap: 6px; }
.stat-card__top { display: flex; justify-content: space-between; gap: 8px; }

.meter { height: 14px; border: 1px solid var(--border); border-radius: 7px; overflow: hidden; background: rgba(0, 0, 0, 0.4); }
.meter__fill { height: 100%; background: linear-gradient(90deg, #7a0e1f, var(--accent)); transition: width 0.2s; }
.meter--full .meter__fill { background: linear-gradient(90deg, var(--accent), var(--ember)); box-shadow: 0 0 12px var(--accent); }

.hp { height: 10px; border-radius: 5px; overflow: hidden; background: rgba(0, 0, 0, 0.4); }
.hp__fill { height: 100%; background: var(--accent); transition: width 80ms linear; }

.tip { position: relative; display: inline-flex; outline: none; }
.tip__pop {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  width: max-content;
  max-width: 240px;
  background: var(--panel-2);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 10px;
  box-shadow: var(--glow);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.12s;
  z-index: 80;
  text-align: left;
}
.tip:hover .tip__pop, .tip:focus .tip__pop, .tip:focus-within .tip__pop { opacity: 1; visibility: visible; }
.tip__title { margin: 0 0 4px; font-size: 12px; color: var(--accent); }
.tip__body { margin: 0; font-size: 12px; line-height: 1.4; color: var(--muted); }

.modal__scrim {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(5, 2, 3, 0.8);
  backdrop-filter: blur(3px);
  z-index: 100;
}
.modal { max-width: 420px; text-align: center; }
.modal__lore { margin: 10px 0 18px; color: var(--muted); line-height: 1.6; }

.toast-host { position: fixed; right: 18px; top: 18px; display: flex; flex-direction: column; gap: 8px; z-index: 90; }
.toast {
  background: var(--panel-2);
  border: 1px solid var(--accent);
  border-radius: 8px;
  padding: 10px 14px;
  box-shadow: var(--glow);
  animation: toast-in 0.25s ease-out;
}
@keyframes toast-in { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: none; } }

.nudge { text-align: center; color: var(--muted); font-size: 13px; letter-spacing: 1px; min-height: 18px; }

.reveal { animation: reveal-in 0.4s ease-out; }
@keyframes reveal-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
```

- [ ] **Step 2: Import the stylesheet in main.tsx**

Edit `src/main.tsx` — add as the **first** line (above existing imports):

```tsx
import "./ui/styles.css";
```

- [ ] **Step 3: Recolor the anti-FOUC body in index.html**

In `index.html`, replace the `<body ...>` opening tag (line 8) with:

```html
  <body style="margin: 0; background: #0a0608; color: #e8dcc8; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">
```

- [ ] **Step 4: Verify the build is green**

Run: `npm run build`
Expected: exits 0 (the stylesheet is valid; the import resolves).

- [ ] **Step 5: Commit**

```bash
git add src/ui/styles.css src/main.tsx index.html
git commit -m "style: add crimson theme stylesheet and retire blue palette"
```

---

## Task 2: Reveal predicate & thresholds

**Files:**
- Create: `src/content/ui.ts`
- Create: `src/ui/reveal.ts`
- Test: `test/reveal.test.ts`

**Interfaces:**
- Consumes: `GameState` from `src/state/types.ts`; `Decimal`, `D` from `src/engine/decimal.ts`.
- Produces:
  - `export const REVEAL: { trainingKills: Decimal; zoneKills: Decimal; gluttonyKills: Decimal }` (from `src/content/ui.ts`)
  - `export type Panel = "foe" | "status" | "training" | "zone" | "gluttony"`
  - `export const PANELS: readonly Panel[]`
  - `export function isRevealed(panel: Panel, state: GameState): boolean`
  - `export const REVEAL_COPY: Record<Panel, string>`

- [ ] **Step 1: Create the threshold constants**

Create `src/content/ui.ts`:

```ts
import { D, Decimal } from "../engine/decimal";

// Progressive-reveal thresholds (kills), tuned later. Single source for reveal numbers.
export const REVEAL: { trainingKills: Decimal; zoneKills: Decimal; gluttonyKills: Decimal } = {
  trainingKills: D(1),
  zoneKills: D(10),
  gluttonyKills: D(50),
};
```

- [ ] **Step 2: Write the failing test**

Create `test/reveal.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { defaultState } from "../src/state/store";
import { D } from "../src/engine/decimal";
import { isRevealed, PANELS, REVEAL_COPY } from "../src/ui/reveal";

describe("isRevealed", () => {
  it("always reveals foe and status on a fresh save", () => {
    const s = defaultState();
    expect(isRevealed("foe", s)).toBe(true);
    expect(isRevealed("status", s)).toBe(true);
  });

  it("hides training, zone, gluttony on a fresh save", () => {
    const s = defaultState();
    expect(isRevealed("training", s)).toBe(false);
    expect(isRevealed("zone", s)).toBe(false);
    expect(isRevealed("gluttony", s)).toBe(false);
  });

  it("reveals training after the first kill", () => {
    const s = defaultState();
    s.totalKills = D(1);
    expect(isRevealed("training", s)).toBe(true);
    expect(isRevealed("zone", s)).toBe(false);
  });

  it("reveals zone then gluttony as kills climb", () => {
    const s = defaultState();
    s.totalKills = D(10);
    expect(isRevealed("zone", s)).toBe(true);
    expect(isRevealed("gluttony", s)).toBe(false);
    s.totalKills = D(50);
    expect(isRevealed("gluttony", s)).toBe(true);
  });

  it("exposes reveal copy for every panel", () => {
    for (const p of PANELS) {
      expect(typeof REVEAL_COPY[p]).toBe("string");
    }
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -- reveal`
Expected: FAIL — cannot resolve `../src/ui/reveal`.

- [ ] **Step 4: Write the implementation**

Create `src/ui/reveal.ts`:

```ts
import { GameState } from "../state/types";
import { REVEAL } from "../content/ui";

export type Panel = "foe" | "status" | "training" | "zone" | "gluttony";

export const PANELS: readonly Panel[] = ["foe", "status", "training", "zone", "gluttony"];

// Reads only monotonic state (totalKills) so a panel never un-reveals after souls are spent.
export function isRevealed(panel: Panel, state: GameState): boolean {
  switch (panel) {
    case "foe":
    case "status":
      return true;
    case "training":
      return state.totalKills.gte(REVEAL.trainingKills);
    case "zone":
      return state.totalKills.gte(REVEAL.zoneKills);
    case "gluttony":
      return state.totalKills.gte(REVEAL.gluttonyKills);
    default:
      return false;
  }
}

export const REVEAL_COPY: Record<Panel, string> = {
  foe: "",
  status: "",
  training: "『 Strength can be devoured. Spend. 』",
  zone: "『 This prey is beneath you. Hunt deeper. 』",
  gluttony: "『 The skill deepens. Digest what you are. 』",
};
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- reveal`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add src/content/ui.ts src/ui/reveal.ts test/reveal.test.ts
git commit -m "feat: add panel reveal predicate as single visibility source"
```

---

## Task 3: Objective nudge selector

**Files:**
- Create: `src/ui/nudge.ts`
- Test: `test/nudge.test.ts`

**Interfaces:**
- Consumes: `GameState` (`src/state/types.ts`); `STAT_ORDER` (`src/state/types.ts`); `REVEAL` (`src/content/ui.ts`).
- Produces: `export function nextObjective(state: GameState): string | null`.

- [ ] **Step 1: Write the failing test**

Create `test/nudge.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { defaultState } from "../src/state/store";
import { D } from "../src/engine/decimal";
import { nextObjective } from "../src/ui/nudge";

describe("nextObjective", () => {
  it("tells a brand-new player to let hunger devour the foe", () => {
    const s = defaultState();
    expect(nextObjective(s)).toContain("devour the foe");
  });

  it("tells a player with souls and no training to spend", () => {
    const s = defaultState();
    s.totalKills = D(1);
    s.souls = D(5);
    expect(nextObjective(s)).toContain("Spend Souls");
  });

  it("returns null once all tracked objectives are met", () => {
    const s = defaultState();
    s.totalKills = D(60);
    s.souls = D(5);
    s.stats.STR.trained = D(1);
    s.maxZone = 2;
    s.gluttonyLevel = D(1);
    expect(nextObjective(s)).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- nudge`
Expected: FAIL — cannot resolve `../src/ui/nudge`.

- [ ] **Step 3: Write the implementation**

Create `src/ui/nudge.ts`:

```ts
import { GameState, STAT_ORDER } from "../state/types";
import { REVEAL } from "../content/ui";

// Returns the first unmet objective's skill-voice line, or null when none remain.
export function nextObjective(state: GameState): string | null {
  if (state.totalKills.lt(1)) {
    return "『 Let your hunger devour the foe before you. 』";
  }
  const trainedAny = STAT_ORDER.some((s) => state.stats[s].trained.gt(0));
  if (state.souls.gt(0) && !trainedAny) {
    return "『 Spend Souls — devour Strength into your own. 』";
  }
  if (state.totalKills.lt(REVEAL.zoneKills)) {
    return "『 Cull more prey to open the path deeper. 』";
  }
  if (state.maxZone < 1) {
    return "『 Hunt deeper. Advance a zone. 』";
  }
  if (state.gluttonyLevel.lt(1) && state.totalKills.gte(REVEAL.gluttonyKills)) {
    return "『 The skill strains to deepen. Digest. 』";
  }
  return null;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- nudge`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/ui/nudge.ts test/nudge.test.ts
git commit -m "feat: add skill-voice next-objective selector"
```

---

## Task 4: Tooltip copy registry

**Files:**
- Create: `src/ui/tooltips.ts`
- Test: `test/tooltips.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `export interface TooltipCopy { title: string; body: string }`
  - `export const TOOLTIPS: Record<string, TooltipCopy>`
  - `export function getTooltip(id: string): TooltipCopy | null`

- [ ] **Step 1: Write the failing test**

Create `test/tooltips.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { getTooltip } from "../src/ui/tooltips";

describe("getTooltip", () => {
  it("returns copy for a known id", () => {
    const t = getTooltip("hunger");
    expect(t).not.toBeNull();
    expect(t?.title.length).toBeGreaterThan(0);
    expect(t?.body.length).toBeGreaterThan(0);
  });

  it("returns null for an unknown id", () => {
    expect(getTooltip("nope")).toBeNull();
  });

  it("has copy for every stat", () => {
    for (const stat of ["STR", "VIT", "AGI", "DEX", "MAG", "MND"]) {
      expect(getTooltip(`stat-${stat}`)).not.toBeNull();
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tooltips`
Expected: FAIL — cannot resolve `../src/ui/tooltips`.

- [ ] **Step 3: Write the implementation**

Create `src/ui/tooltips.ts`:

```ts
export interface TooltipCopy {
  title: string;
  body: string;
}

export const TOOLTIPS: Record<string, TooltipCopy> = {
  souls: { title: "Souls", body: "Harvested from the devoured. Spend them to train your stats." },
  dps: { title: "Damage / sec", body: "How fast your hunger tears through the foe. Rises with your stats." },
  hunger: { title: "Hunger", body: "Rises as you devour. Left unfed it gnaws at you — Mind slows its drain." },
  gluttony: { title: "Gluttony", body: "Your cursed skill's tier. Each Digest deepens its multiplier." },
  kills: { title: "Kills", body: "Foes devoured. The more you cull, the stronger the prey becomes." },
  "hard-reset": { title: "Hard Reset", body: "Wipes ALL progress and begins the feast anew. There is no undo." },
  "stat-STR": { title: "STR — Strength", body: "Physical attack power. Raises damage against the devoured." },
  "stat-VIT": { title: "VIT — Vitality", body: "Endurance. Gates how deep into the zones you can safely hunt." },
  "stat-AGI": { title: "AGI — Agility", body: "Attack speed. Works with Frenzy to strike faster." },
  "stat-DEX": { title: "DEX — Dexterity", body: "Critical strength. Increases your critical-hit multiplier." },
  "stat-MAG": { title: "MAG — Magic", body: "Magical attack power. Adds to your total damage." },
  "stat-MND": { title: "MND — Mind", body: "Slows Hunger's drain and quickens absorption of stolen stats." },
  frenzy: { title: "Frenzy", body: "Feeds your attack speed — the bloodlust that lets you strike again." },
  zone: { title: "Zone", body: "How deep you hunt. Deeper zones yield richer souls but deadlier prey." },
  "advance-zone": { title: "Advance Zone", body: "Descend to deadlier prey once you've culled enough of the current foe." },
  digest: { title: "Digest", body: "Consume your progress to raise Gluttony — a permanent feeding multiplier." },
  awaken: { title: "Awaken", body: "A deeper reset that awakens the skill further, compounding all you devour." },
};

export function getTooltip(id: string): TooltipCopy | null {
  return TOOLTIPS[id] ?? null;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- tooltips`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/ui/tooltips.ts test/tooltips.test.ts
git commit -m "feat: add tooltip copy registry with skill-voice flavor"
```

---

## Task 5: UI preferences persistence

**Files:**
- Create: `src/ui/uiPrefs.ts`
- Test: `test/uiPrefs.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `export interface UiPrefs { welcomeSeen: boolean; seenReveals: string[]; hintsSeen: string[] }`
  - `export function defaultUiPrefs(): UiPrefs`
  - `export function parseUiPrefs(raw: string | null): UiPrefs`
  - `export function serializeUiPrefs(prefs: UiPrefs): string`
  - `export function loadUiPrefs(): UiPrefs`
  - `export function saveUiPrefs(prefs: UiPrefs): void`

- [ ] **Step 1: Write the failing test**

Create `test/uiPrefs.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { defaultUiPrefs, parseUiPrefs, serializeUiPrefs } from "../src/ui/uiPrefs";

describe("uiPrefs parsing", () => {
  it("returns defaults for null", () => {
    expect(parseUiPrefs(null)).toEqual(defaultUiPrefs());
  });

  it("returns defaults for malformed JSON", () => {
    expect(parseUiPrefs("{not json")).toEqual(defaultUiPrefs());
  });

  it("merges partial saved prefs over defaults", () => {
    const parsed = parseUiPrefs(JSON.stringify({ welcomeSeen: true, seenReveals: ["zone"] }));
    expect(parsed.welcomeSeen).toBe(true);
    expect(parsed.seenReveals).toEqual(["zone"]);
    expect(parsed.hintsSeen).toEqual([]);
  });

  it("drops non-string ids in arrays", () => {
    const parsed = parseUiPrefs(JSON.stringify({ seenReveals: ["ok", 5, null] }));
    expect(parsed.seenReveals).toEqual(["ok"]);
  });

  it("round-trips through serialize", () => {
    const prefs = { welcomeSeen: true, seenReveals: ["zone"], hintsSeen: ["a"] };
    expect(parseUiPrefs(serializeUiPrefs(prefs))).toEqual(prefs);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- uiPrefs`
Expected: FAIL — cannot resolve `../src/ui/uiPrefs`.

- [ ] **Step 3: Write the implementation**

Create `src/ui/uiPrefs.ts`:

```ts
const STORAGE_KEY = "gluttony.ui";

export interface UiPrefs {
  welcomeSeen: boolean;
  seenReveals: string[];
  hintsSeen: string[];
}

export function defaultUiPrefs(): UiPrefs {
  return { welcomeSeen: false, seenReveals: [], hintsSeen: [] };
}

function strings(value: unknown, fallback: string[]): string[] {
  return Array.isArray(value) ? value.filter((x: unknown): x is string => typeof x === "string") : fallback;
}

export function parseUiPrefs(raw: string | null): UiPrefs {
  const base = defaultUiPrefs();
  if (!raw) return base;
  try {
    const o = JSON.parse(raw);
    if (!o || typeof o !== "object") return base;
    return {
      welcomeSeen: typeof o.welcomeSeen === "boolean" ? o.welcomeSeen : base.welcomeSeen,
      seenReveals: strings(o.seenReveals, base.seenReveals),
      hintsSeen: strings(o.hintsSeen, base.hintsSeen),
    };
  } catch {
    return base;
  }
}

export function serializeUiPrefs(prefs: UiPrefs): string {
  return JSON.stringify(prefs);
}

export function loadUiPrefs(): UiPrefs {
  if (typeof localStorage === "undefined") return defaultUiPrefs();
  return parseUiPrefs(localStorage.getItem(STORAGE_KEY));
}

export function saveUiPrefs(prefs: UiPrefs): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, serializeUiPrefs(prefs));
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- uiPrefs`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/ui/uiPrefs.ts test/uiPrefs.test.ts
git commit -m "feat: persist UI prefs in separate gluttony.ui key"
```

---

## Task 6: Tooltip component

**Files:**
- Create: `src/ui/Tooltip.tsx`

**Interfaces:**
- Consumes: `getTooltip` (`src/ui/tooltips.ts`); `.tip`/`.tip__pop`/`.tip__title`/`.tip__body` CSS (Task 1).
- Produces: `export function Tooltip(props: { id: string; children: ReactNode }): JSX.Element`.

- [ ] **Step 1: Write the component**

Create `src/ui/Tooltip.tsx`:

```tsx
import type { ReactNode } from "react";
import { getTooltip } from "./tooltips";

export function Tooltip({ id, children }: { id: string; children: ReactNode }) {
  const copy = getTooltip(id);
  if (!copy) return <>{children}</>;
  return (
    <span className="tip" tabIndex={0}>
      {children}
      <span className="tip__pop" role="tooltip">
        <p className="tip__title">{copy.title}</p>
        <p className="tip__body">{copy.body}</p>
      </span>
    </span>
  );
}
```

- [ ] **Step 2: Verify the build is green**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/ui/Tooltip.tsx
git commit -m "feat: add hover/focus tooltip component"
```

---

## Task 7: Hunger blood-meter component

**Files:**
- Create: `src/ui/HungerBar.tsx`

**Interfaces:**
- Consumes: `.meter`/`.meter__fill`/`.meter--full` CSS (Task 1).
- Produces: `export function HungerBar(props: { value: number; max: number }): JSX.Element`.

- [ ] **Step 1: Write the component**

Create `src/ui/HungerBar.tsx`:

```tsx
export function HungerBar({ value, max }: { value: number; max: number }) {
  const ratio = max > 0 ? Math.min(1, value / max) : 0;
  const full = ratio >= 1;
  return (
    <div
      className={"meter" + (full ? " meter--full" : "")}
      role="meter"
      aria-label="Hunger"
      aria-valuenow={Math.round(ratio * 100)}
    >
      <div className="meter__fill" style={{ width: `${ratio * 100}%` }} />
    </div>
  );
}
```

- [ ] **Step 2: Verify the build is green**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/ui/HungerBar.tsx
git commit -m "feat: add hunger blood-meter component"
```

---

## Task 8: UI prefs Zustand store

**Files:**
- Create: `src/ui/useUiPrefs.ts`

**Interfaces:**
- Consumes: `UiPrefs`, `loadUiPrefs`, `saveUiPrefs` (`src/ui/uiPrefs.ts`).
- Produces: `export const useUiPrefs` — a Zustand store of `UiPrefs` plus `dismissWelcome(): void`, `markRevealSeen(id: string): void`, `markHintSeen(id: string): void`.

- [ ] **Step 1: Write the store**

Create `src/ui/useUiPrefs.ts`:

```tsx
import { create } from "zustand";
import { UiPrefs, loadUiPrefs, saveUiPrefs } from "./uiPrefs";

interface UiPrefsStore extends UiPrefs {
  dismissWelcome: () => void;
  markRevealSeen: (id: string) => void;
  markHintSeen: (id: string) => void;
}

function persist(s: UiPrefs): void {
  saveUiPrefs({ welcomeSeen: s.welcomeSeen, seenReveals: s.seenReveals, hintsSeen: s.hintsSeen });
}

export const useUiPrefs = create<UiPrefsStore>((set, get) => ({
  ...loadUiPrefs(),
  dismissWelcome: () => {
    set({ welcomeSeen: true });
    persist(get());
  },
  markRevealSeen: (id) => {
    if (get().seenReveals.includes(id)) return;
    set({ seenReveals: [...get().seenReveals, id] });
    persist(get());
  },
  markHintSeen: (id) => {
    if (get().hintsSeen.includes(id)) return;
    set({ hintsSeen: [...get().hintsSeen, id] });
    persist(get());
  },
}));
```

- [ ] **Step 2: Verify the build is green**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/ui/useUiPrefs.ts
git commit -m "feat: add zustand store for persisted UI prefs"
```

---

## Task 9: Skill-acquired toast component

**Files:**
- Create: `src/ui/SkillToast.tsx`

**Interfaces:**
- Consumes: `.toast-host`/`.toast` CSS (Task 1).
- Produces: `export function ToastHost(props: { messages: string[] }): JSX.Element` — renders a fixed-corner stack of toasts.

- [ ] **Step 1: Write the component**

Create `src/ui/SkillToast.tsx`:

```tsx
export function ToastHost({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null;
  return (
    <div className="toast-host">
      {messages.map((m, i) => (
        <div className="toast" role="status" key={`${i}-${m}`}>
          {m}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify the build is green**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/ui/SkillToast.tsx
git commit -m "feat: add skill-acquired toast host"
```

---

## Task 10: Welcome lore modal

**Files:**
- Create: `src/ui/WelcomeModal.tsx`

**Interfaces:**
- Consumes: `.modal__scrim`/`.modal`/`.panel`/`.panel__title`/`.modal__lore`/`.btn` CSS (Task 1).
- Produces: `export function WelcomeModal(props: { onBegin: () => void }): JSX.Element`.

- [ ] **Step 1: Write the component**

Create `src/ui/WelcomeModal.tsx`:

```tsx
export function WelcomeModal({ onBegin }: { onBegin: () => void }) {
  return (
    <div className="modal__scrim" role="dialog" aria-modal="true" aria-label="The Skill Awakens">
      <div className="panel modal">
        <h2 className="panel__title">The Skill — [ Gluttony ]</h2>
        <p className="modal__lore">
          You are cursed with <strong>Gluttony</strong>. Your hunger devours the foe before you on its
          own — each kill feeds you <strong>Souls</strong>. Spend them to devour stats into your own,
          hunt ever deeper, and grow. Feed the skill... or be consumed by it.
        </p>
        <button className="btn" onClick={onBegin}>
          Begin the Feast
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the build is green**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/ui/WelcomeModal.tsx
git commit -m "feat: add welcome lore modal"
```

---

## Task 11: Objective nudge component

**Files:**
- Create: `src/ui/ObjectiveNudge.tsx`

**Interfaces:**
- Consumes: `nextObjective` (`src/ui/nudge.ts`); `game` (`src/engine/game.ts`); `.nudge` CSS (Task 1).
- Produces: `export function ObjectiveNudge(): JSX.Element | null`.

- [ ] **Step 1: Write the component**

Create `src/ui/ObjectiveNudge.tsx`:

```tsx
import { game } from "../engine/game";
import { nextObjective } from "./nudge";

export function ObjectiveNudge() {
  const line = nextObjective(game.state);
  if (!line) return null;
  return (
    <div className="nudge" role="status">
      {line}
    </div>
  );
}
```

- [ ] **Step 2: Verify the build is green**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/ui/ObjectiveNudge.tsx
git commit -m "feat: add live objective nudge"
```

---

## Task 12: Foe and Status panels

**Files:**
- Create: `src/ui/FoePanel.tsx`
- Create: `src/ui/StatusPanel.tsx`

**Interfaces:**
- Consumes: `game`, `hardReset` (`src/engine/game.ts`); `format` (`src/engine/format.ts`); `combatReadout` (`src/engine/combat.ts`); `HungerBar` (Task 7); `Tooltip` (Task 6); panel CSS (Task 1).
- Produces: `export function FoePanel(): JSX.Element` and `export function StatusPanel(): JSX.Element`.

- [ ] **Step 1: Write the Foe panel**

Create `src/ui/FoePanel.tsx`:

```tsx
import { game } from "../engine/game";
import { format } from "../engine/format";
import { combatReadout } from "../engine/combat";

export function FoePanel() {
  const { state } = game;
  const readout = combatReadout(state);
  const hpPct = Math.max(0, Math.min(100, state.current.hp.div(state.current.maxHp).mul(100).toNumber()));
  return (
    <section className="panel">
      <h2 className="panel__title">[ The Foe ]</h2>
      <div className="row">
        <span className="muted">HP</span>
        <span>
          {format(state.current.hp)} / {format(state.current.maxHp)}
        </span>
      </div>
      <div className="hp">
        <div className="hp__fill" style={{ width: `${hpPct}%` }} />
      </div>
      <div className="row">
        <span className="muted">Tier</span>
        <span>{state.current.tier}</span>
      </div>
      <div className="row">
        <span className="muted">Soul Value</span>
        <span>{format(state.current.soulValue)}</span>
      </div>
      <div className="row">
        <span className="muted">Absorb Rate</span>
        <span>{readout.absorbRate.mul(100).toFixed(2)}%</span>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Write the Status panel**

Create `src/ui/StatusPanel.tsx`:

```tsx
import { game, hardReset } from "../engine/game";
import { format } from "../engine/format";
import { combatReadout } from "../engine/combat";
import { HungerBar } from "./HungerBar";
import { Tooltip } from "./Tooltip";

export function StatusPanel() {
  const { state, ticks } = game;
  const readout = combatReadout(state);
  return (
    <section className="panel">
      <h2 className="panel__title">[ Status ]</h2>
      <Tooltip id="souls">
        <div className="row" style={{ width: "100%" }}>
          <span className="muted">Souls</span>
          <span>{format(state.souls)}</span>
        </div>
      </Tooltip>
      <Tooltip id="dps">
        <div className="row" style={{ width: "100%" }}>
          <span className="muted">DPS</span>
          <span>{format(readout.dps)}</span>
        </div>
      </Tooltip>
      <Tooltip id="kills">
        <div className="row" style={{ width: "100%" }}>
          <span className="muted">Kills</span>
          <span>{format(state.totalKills)}</span>
        </div>
      </Tooltip>
      <Tooltip id="hunger">
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 4 }}>
          <span className="muted">Hunger</span>
          <HungerBar value={state.hunger} max={state.hungerMax} />
        </div>
      </Tooltip>
      <div className="row">
        <span className="muted">Ticks</span>
        <span>{ticks.toLocaleString()}</span>
      </div>
      <Tooltip id="hard-reset">
        <button
          className="btn"
          onClick={() => {
            if (confirm("Wipe ALL progress and begin the feast anew? This cannot be undone.")) hardReset();
          }}
        >
          Hard Reset
        </button>
      </Tooltip>
    </section>
  );
}
```

- [ ] **Step 3: Verify the build is green**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/ui/FoePanel.tsx src/ui/StatusPanel.tsx
git commit -m "feat: add Foe and Status panels with tooltips and blood-meter"
```

---

## Task 13: Training panel

**Files:**
- Create: `src/ui/TrainingPanel.tsx`

**Interfaces:**
- Consumes: `game` (`src/engine/game.ts`); `format`; `STAT_ORDER`, `StatId` (`src/state/types.ts`); `buyFrenzy`, `buyMaxFrenzy`, `buyMaxTraining`, `buyTraining`, `frenzyCost`, `trainingCost` (`src/engine/training.ts`); `Tooltip` (Task 6); panel CSS (Task 1).
- Produces: `export function TrainingPanel(): JSX.Element`.

- [ ] **Step 1: Write the component**

Create `src/ui/TrainingPanel.tsx`:

```tsx
import { game } from "../engine/game";
import { format } from "../engine/format";
import { STAT_ORDER, StatId } from "../state/types";
import { buyFrenzy, buyMaxFrenzy, buyMaxTraining, buyTraining, frenzyCost, trainingCost } from "../engine/training";
import { Tooltip } from "./Tooltip";

function StatCard({ stat }: { stat: StatId }) {
  const state = game.state;
  const cost = trainingCost(state, stat);
  return (
    <div className="stat-card">
      <div className="stat-card__top">
        <Tooltip id={`stat-${stat}`}>
          <strong>{stat}</strong>
        </Tooltip>
        <span>{format(state.stats[stat].value)}</span>
      </div>
      <div className="muted" style={{ fontSize: 12 }}>
        Trained {format(state.stats[stat].trained)}
      </div>
      <div className="muted" style={{ fontSize: 12 }}>
        Cost {format(cost)}
      </div>
      <div className="actions">
        <button className="btn" disabled={state.souls.lt(cost)} onClick={() => buyTraining(state, stat)}>
          Buy
        </button>
        <button className="btn" disabled={state.souls.lt(cost)} onClick={() => buyMaxTraining(state, stat)}>
          Max
        </button>
      </div>
    </div>
  );
}

export function TrainingPanel() {
  const state = game.state;
  const cost = frenzyCost(state);
  return (
    <section className="panel">
      <h2 className="panel__title">[ Training ]</h2>
      <div className="stat-grid">
        {STAT_ORDER.map((stat) => (
          <StatCard key={stat} stat={stat} />
        ))}
      </div>
      <div className="row" style={{ alignItems: "center", marginTop: 6 }}>
        <Tooltip id="frenzy">
          <span>
            <strong>Frenzy</strong> <span className="muted">Bought {format(state.frenzyBought)} · Cost {format(cost)}</span>
          </span>
        </Tooltip>
        <span className="actions">
          <button className="btn" disabled={state.souls.lt(cost)} onClick={() => buyFrenzy(state)}>
            Buy
          </button>
          <button className="btn" disabled={state.souls.lt(cost)} onClick={() => buyMaxFrenzy(state)}>
            Max
          </button>
        </span>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify the build is green**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/ui/TrainingPanel.tsx
git commit -m "feat: add Training panel with stat tooltips"
```

---

## Task 14: Zone and Gluttony panels

**Files:**
- Create: `src/ui/ZonePanel.tsx`
- Create: `src/ui/GluttonyPanel.tsx`

**Interfaces:**
- Consumes: `game` (`src/engine/game.ts`); `format`; `advanceZone`, `canAdvanceZone`, `maxSafeZone`, `zoneKillRequirement` (`src/engine/zones.ts`); `awaken`, `canAwaken`, `canDigest`, `digest` (`src/engine/reset.ts`); `Tooltip` (Task 6); panel CSS (Task 1).
- Produces: `export function ZonePanel(): JSX.Element` and `export function GluttonyPanel(): JSX.Element`.

- [ ] **Step 1: Write the Zone panel**

Create `src/ui/ZonePanel.tsx`:

```tsx
import { game } from "../engine/game";
import { format } from "../engine/format";
import { advanceZone, canAdvanceZone, maxSafeZone, zoneKillRequirement } from "../engine/zones";
import { Tooltip } from "./Tooltip";

export function ZonePanel() {
  const { state } = game;
  return (
    <section className="panel">
      <h2 className="panel__title">[ The Hunt ]</h2>
      <Tooltip id="zone">
        <div className="row" style={{ width: "100%" }}>
          <span className="muted">Zone</span>
          <span>
            {state.zone} / {state.maxZone}
          </span>
        </div>
      </Tooltip>
      <div className="row">
        <span className="muted">Safe Depth</span>
        <span>{maxSafeZone(state)}</span>
      </div>
      <div className="row">
        <span className="muted">Next Zone</span>
        <span>{format(zoneKillRequirement(state.zone + 1))} kills</span>
      </div>
      <Tooltip id="advance-zone">
        <button className="btn" disabled={!canAdvanceZone(state)} onClick={() => advanceZone(state)}>
          Advance Zone
        </button>
      </Tooltip>
    </section>
  );
}
```

- [ ] **Step 2: Write the Gluttony panel**

Create `src/ui/GluttonyPanel.tsx`:

```tsx
import { game } from "../engine/game";
import { format } from "../engine/format";
import { awaken, canAwaken, canDigest, digest } from "../engine/reset";
import { Tooltip } from "./Tooltip";

export function GluttonyPanel() {
  const { state } = game;
  return (
    <section className="panel">
      <h2 className="panel__title">[ Gluttony ]</h2>
      <Tooltip id="gluttony">
        <div className="row" style={{ width: "100%" }}>
          <span className="muted">Gluttony Lv</span>
          <span>{format(state.gluttonyLevel)}</span>
        </div>
      </Tooltip>
      <div className="row">
        <span className="muted">Awakenings</span>
        <span>{format(state.awakenings)}</span>
      </div>
      <Tooltip id="digest">
        <button className="btn" disabled={!canDigest(state)} onClick={() => digest(state)}>
          Digest
        </button>
      </Tooltip>
      <Tooltip id="awaken">
        <button className="btn" disabled={!canAwaken(state)} onClick={() => awaken(state)}>
          Awaken
        </button>
      </Tooltip>
    </section>
  );
}
```

- [ ] **Step 3: Verify the build is green**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/ui/ZonePanel.tsx src/ui/GluttonyPanel.tsx
git commit -m "feat: add Zone and Gluttony panels with tooltips"
```

---

## Task 15: Compose the shell and wire it in

**Files:**
- Create: `src/ui/AppShell.tsx`
- Modify: `src/App.tsx`
- Delete: `src/ui/StatusWindow.tsx`

**Interfaces:**
- Consumes: `useRender` (`src/state/store.ts`); `game` (`src/engine/game.ts`); `isRevealed`, `PANELS`, `REVEAL_COPY`, `Panel` (`src/ui/reveal.ts`); `useUiPrefs` (Task 8); all panel components (Tasks 12–14); `WelcomeModal` (Task 10); `ObjectiveNudge` (Task 11); `ToastHost` (Task 9); `Tooltip` (Task 6); `HungerBar` (Task 7); `format` (`src/engine/format.ts`); `.app-shell`/`.resourcebar`/`.resource`/`.reveal` CSS (Task 1).
- Produces: `export function AppShell(): JSX.Element`.

- [ ] **Step 1: Write the shell**

Create `src/ui/AppShell.tsx`:

```tsx
import { useEffect } from "react";
import { useRender } from "../state/store";
import { game } from "../engine/game";
import { format } from "../engine/format";
import { isRevealed, PANELS, REVEAL_COPY, Panel } from "./reveal";
import { useUiPrefs } from "./useUiPrefs";
import { Tooltip } from "./Tooltip";
import { HungerBar } from "./HungerBar";
import { FoePanel } from "./FoePanel";
import { StatusPanel } from "./StatusPanel";
import { TrainingPanel } from "./TrainingPanel";
import { ZonePanel } from "./ZonePanel";
import { GluttonyPanel } from "./GluttonyPanel";
import { WelcomeModal } from "./WelcomeModal";
import { ObjectiveNudge } from "./ObjectiveNudge";
import { ToastHost } from "./SkillToast";

const PANEL_COMPONENTS: Record<Panel, () => JSX.Element> = {
  foe: FoePanel,
  status: StatusPanel,
  training: TrainingPanel,
  zone: ZonePanel,
  gluttony: GluttonyPanel,
};

export function AppShell() {
  useRender((s) => s.frame); // re-render each tick to sample live game state
  const prefs = useUiPrefs();
  const state = game.state;

  // Fire a one-time toast the first time a panel clears its reveal threshold.
  const newlyRevealed = PANELS.filter(
    (p) => REVEAL_COPY[p] !== "" && isRevealed(p, state) && !prefs.seenReveals.includes(p),
  );
  useEffect(() => {
    for (const p of newlyRevealed) prefs.markRevealSeen(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newlyRevealed.join(",")]);

  return (
    <div className="app-shell">
      {!prefs.welcomeSeen && <WelcomeModal onBegin={prefs.dismissWelcome} />}

      <header className="resourcebar panel">
        <Tooltip id="souls">
          <span className="resource">
            <span className="muted">Souls</span>
            <span>{format(state.souls)}</span>
          </span>
        </Tooltip>
        <Tooltip id="hunger">
          <span className="resource">
            <span className="muted">Hunger</span>
            <span style={{ width: 96 }}>
              <HungerBar value={state.hunger} max={state.hungerMax} />
            </span>
          </span>
        </Tooltip>
        <Tooltip id="gluttony">
          <span className="resource">
            <span className="muted">Gluttony</span>
            <span>Lv {format(state.gluttonyLevel)}</span>
          </span>
        </Tooltip>
      </header>

      <ObjectiveNudge />

      {PANELS.map((p) => {
        if (!isRevealed(p, state)) return null;
        const Panel = PANEL_COMPONENTS[p];
        return (
          <div className="reveal" key={p}>
            <Panel />
          </div>
        );
      })}

      <ToastHost messages={newlyRevealed.map((p) => REVEAL_COPY[p])} />
    </div>
  );
}
```

- [ ] **Step 2: Wire it into App.tsx**

Replace the entire contents of `src/App.tsx` with:

```tsx
import { AppShell } from "./ui/AppShell";

export function App() {
  return <AppShell />;
}
```

- [ ] **Step 3: Delete the old StatusWindow**

Run: `git rm src/ui/StatusWindow.tsx`
Expected: the file is removed (no other file imports it after Step 2).

- [ ] **Step 4: Verify the full build and tests**

Run: `npm run build && npm test`
Expected: build exits 0; all tests pass — the existing 14 engine tests plus four new suites (`reveal` 5, `nudge` 3, `tooltips` 3, `uiPrefs` 5) = **30 tests**.

- [ ] **Step 5: Manual visual verification**

Run: `npm run dev` and open the served URL. Confirm:
- First load shows the "The Skill — [ Gluttony ]" crimson lore modal; "Begin the Feast" dismisses it and it does not reappear on reload.
- The screen is crimson/obsidian (no blue). A centered resource bar shows Souls, a Hunger blood-meter, and Gluttony Lv.
- Only **The Foe** and **Status** panels are visible on a fresh save; Training/The Hunt/Gluttony are absent.
- As kills accrue, Training appears (≈1 kill), then The Hunt (≈10), then Gluttony (≈50) — each fading in, each firing a one-time crimson "SKILL ACQUIRED"-style toast top-right.
- The skill-voice objective nudge under the resource bar updates as you progress (and disappears when objectives are exhausted).
- Hovering or keyboard-focusing Souls/Hunger/Gluttony/stats/actions shows crimson tooltips.
- Reloading after reaching a milestone keeps those panels revealed and does **not** re-fire their toasts.

- [ ] **Step 6: Commit**

```bash
git add src/ui/AppShell.tsx src/App.tsx
git commit -m "feat: compose crimson command-console shell and retire StatusWindow"
```

---

## Self-Review

**1. Spec coverage:**
- Crimson LitRPG theme → Task 1 (tokens + classes), applied by Tasks 12–15; blue removed in Task 1.
- Intro (lore modal + objective nudge) → Tasks 10, 11; wired in Task 15.
- Hover/focus tooltips → Tasks 4, 6; consumed across Tasks 12–15.
- Progressive reveal (hidden until earned) → Task 2 (`reveal.ts`) consumed by Task 15; mapping matches spec table.
- Hunger blood-meter flourish → Task 7; used in Task 12 + Task 15.
- Skill-acquired toast flourish → Tasks 2 (`REVEAL_COPY`) + 9 (`ToastHost`) + 15 (fire-once logic via `seenReveals`).
- Separate `gluttony.ui` persistence → Tasks 5, 8; game save untouched (no engine/state files modified).
- Idle-combat onboarding copy → Task 10 modal + Task 3 nudge wording ("devours ... on its own").
- Two gates / Decimal rules / strict TS → Global Constraints, enforced per task.

**2. Placeholder scan:** No "TBD"/"TODO"/"handle edge cases"/"similar to Task N" — every code and test block is complete and inlined.

**3. Type consistency:** `Panel`, `isRevealed`, `PANELS`, `REVEAL_COPY` (Task 2) are reused verbatim in Task 15. `REVEAL` (Task 2) consumed by `nudge.ts` (Task 3). `UiPrefs` + `loadUiPrefs`/`saveUiPrefs` (Task 5) consumed by `useUiPrefs` (Task 8); store methods `dismissWelcome`/`markRevealSeen`/`markHintSeen` match their Task 15 call sites (`dismissWelcome`, `markRevealSeen`). `getTooltip`/`TooltipCopy` (Task 4) consumed by `Tooltip` (Task 6). `nextObjective` (Task 3) consumed by `ObjectiveNudge` (Task 11). Engine signatures (`combatReadout`, `trainingCost`, `frenzyCost`, `zoneKillRequirement(zone:number)`, `canDigest/digest/canAwaken/awaken`, `canAdvanceZone/advanceZone/maxSafeZone`, `hardReset`) match their current definitions in `StatusWindow.tsx`. `markHintSeen` is defined for future hint use; it is intentionally unused by components in this plan but is exercised by no test — note: to satisfy `noUnusedLocals` it lives on the store object (a property, not a local), so it does not trip strict TS.

No gaps found.
