# Berserk of Gluttony — UI Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single centered Phase-1 status panel with a full-screen, themed "Command Console" UI shell — Crimson & Obsidian (Berserk of Gluttony) styling, progressive-disclosure layout, a first-load lore modal, just-in-time hints, and hover/focus tooltips — wiring the live Phase-1 data (Souls, Hunger, Gluttony level) and rendering all unbuilt systems as clearly-marked locked placeholders.

**Architecture:** A CSS-grid `AppShell` fills the viewport with a top resource bar, three columns (Status / Devour arena / Actions), and a bottom tab rail. All panels *read* `game.state` and `game.ticks` (they never compute combat math). Feature gating flows from one pure predicate module (`unlocks.ts`) that tabs, locked overlays, and hints all consult, so future phases unlock content by editing that one file. Onboarding/hint/collapse state persists in a **separate `gluttony.ui` localStorage key**, never the SPEC-frozen game save. Visual theming lives in one `styles.css` (CSS custom properties + classes) enabling hover, animation, and responsiveness that inline styles cannot express.

**Tech Stack:** React 18 + TypeScript (strict), Vite 5, Zustand 4 (existing render store), Vitest 2 (node environment), `break_infinity.js` Decimals.

## Global Constraints

- **Big numbers:** Currencies/stats/HP are `Decimal` (`break_infinity.js`). Never use JS `+ - * <` on Decimals — use `.add/.mul/.gt`. `hunger`/`hungerMax`/`zone` are bounded JS `number`s (arithmetic on those is fine).
- **UI reads results, not math:** No combat/DPS/souls-per-kill computation in `src/ui/*`. Components only read `game.state` / `game.ticks` and call `format()`. (SPEC §7.)
- **Do NOT modify the game save shape:** `GameState` (`src/state/types.ts`) and `defaultState()` are frozen by SPEC. All UI/onboarding state goes in the separate `gluttony.ui` localStorage key via `src/ui/uiPrefs.ts`.
- **Numbers display via** `format(value, notation?, places?)` from `src/engine/format.ts`.
- **Test environment is `node`** (no DOM, no testing-library). Unit tests cover **pure logic only** (`unlocks`, `tooltips`, `uiPrefs`, `hints`). React components are gated by `npm run build` (which runs `tsc` typecheck then `vite build`) — there is no component render test.
- **Two gates, every task:** logic tasks must pass `npm test`; every task (logic and UI) must keep `npm run build` green. Strict TS is on with `noUnusedLocals`/`noUnusedParameters` — no unused imports or params.
- **Frequent commits:** one commit per task, message prefix `feat:` / `style:` / `chore:`.
- **Palette (Crimson & Obsidian):** `--bg #0a0608`, `--panel #160a0d`, `--border #b3122c` (blood), `--accent #e23a4e` (ember), `--text #e8dcc8` (bone), `--muted rgba(232,220,200,.55)`.

---

## File Structure

**Create (logic — unit-tested):**
- `src/ui/unlocks.ts` — `Feature` union + `isUnlocked(feature, state)` pure predicate (single source of gating).
- `src/ui/tooltips.ts` — `TOOLTIPS` copy map + `getTooltip(id)`.
- `src/ui/uiPrefs.ts` — `UiPrefs` type + pure `parse/serialize/default` + localStorage `load/save` wrappers (separate `gluttony.ui` key).
- `src/ui/hints.ts` — `Hint[]` registry + `pendingHints(state, seen)`.
- `test/unlocks.test.ts`, `test/tooltips.test.ts`, `test/uiPrefs.test.ts`, `test/hints.test.ts`.

**Create (React — build-gated):**
- `src/ui/styles.css` — all theme tokens, utilities, layout grid, animations, responsive rules.
- `src/ui/Tooltip.tsx` — hover/focus tooltip wrapper.
- `src/ui/HungerBar.tsx` — reusable hunger meter.
- `src/ui/useUiPrefs.ts` — Zustand store wrapping `uiPrefs` persistence.
- `src/ui/ResourceBar.tsx`, `src/ui/StatusPanel.tsx`, `src/ui/DevourArena.tsx`, `src/ui/ActionsPanel.tsx`, `src/ui/TabRail.tsx` — the four console regions + top bar.
- `src/ui/onboarding/WelcomeModal.tsx`, `src/ui/onboarding/HintBeacon.tsx`.
- `src/ui/AppShell.tsx` — composes the grid.

**Modify:**
- `src/main.tsx` — import the stylesheet.
- `src/App.tsx` — render `<AppShell />`.
- `index.html` — recolor the anti-FOUC body background.

**Delete:**
- `src/ui/StatusWindow.tsx` — superseded by `ResourceBar` + `StatusPanel`.

---

### Task 1: Global stylesheet & theme tokens

**Files:**
- Create: `src/ui/styles.css`
- Modify: `src/main.tsx:1` (add stylesheet import)
- Modify: `index.html:8` (recolor body for anti-FOUC)

**Interfaces:**
- Consumes: nothing.
- Produces: CSS custom properties on `:root` (`--bg`, `--panel`, `--panel-2`, `--border`, `--accent`, `--ember`, `--text`, `--muted`, `--glow`, `--radius`, `--gap`, `--font`) and utility classes `.panel`, `.panel__title`, `.row`, `.muted`, `.btn`, `.icon-btn`, `.locked`, `.locked__badge`, `.tip`, `.tip__pop`, `.tip__title`, `.tip__body`, `.meter`, `.meter__fill`, `.meter--full`, `.beacon`, `.beacon-host`, `.modal__scrim`, `.modal`, `.modal__lore`, plus the `ember-pulse` keyframe. Later tasks append layout classes to this file.

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

.panel {
  position: relative;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--glow);
  padding: 16px;
}
.panel__title {
  margin: 0 0 10px;
  letter-spacing: 3px;
  font-size: 14px;
  text-align: center;
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
.icon-btn { padding: 6px 10px; }

.locked { opacity: 0.55; filter: saturate(0.5); border-style: dashed !important; }
.locked__badge { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; color: var(--accent); letter-spacing: 1px; }

.tip { position: relative; display: inline-flex; }
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
  text-align: left;
  z-index: 50;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.12s;
  pointer-events: none;
}
.tip:hover .tip__pop, .tip:focus-within .tip__pop { opacity: 1; visibility: visible; }
.tip__title { margin: 0 0 4px; color: var(--accent); font-size: 12px; letter-spacing: 1px; }
.tip__body { margin: 0; color: var(--text); font-size: 12px; line-height: 1.4; }

.meter { height: 14px; border: 1px solid var(--border); border-radius: 7px; overflow: hidden; background: rgba(0, 0, 0, 0.4); }
.meter__fill { height: 100%; background: linear-gradient(90deg, #7a0e1f, var(--accent)); transition: width 0.2s; }
.meter--full .meter__fill { background: linear-gradient(90deg, var(--accent), var(--ember)); box-shadow: 0 0 12px var(--accent); }

@keyframes ember-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(226, 58, 78, 0.5); }
  50% { box-shadow: 0 0 0 8px rgba(226, 58, 78, 0); }
}
.beacon-host { position: fixed; right: 18px; bottom: 84px; z-index: 60; }
.beacon { width: 14px; height: 14px; border: none; border-radius: 50%; background: var(--accent); cursor: pointer; animation: ember-pulse 1.6s infinite; }

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
```

- [ ] **Step 2: Import the stylesheet in main.tsx**

Edit `src/main.tsx` — add this as the first import line (above the existing imports):

```tsx
import "./ui/styles.css";
```

- [ ] **Step 3: Recolor the anti-FOUC body in index.html**

In `index.html`, replace the `<body ...>` opening tag (line 8) with:

```html
  <body style="margin: 0; background: #0a0608; color: #e8dcc8; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">
```

- [ ] **Step 4: Verify the build typechecks and compiles**

Run: `npm run build`
Expected: exits 0 (tsc + vite build succeed). The dev server (`npm run dev`) shows a near-black background; the old blue panel is unchanged for now.

- [ ] **Step 5: Commit**

```bash
git add src/ui/styles.css src/main.tsx index.html
git commit -m "style: add Crimson & Obsidian theme tokens and global stylesheet"
```

---

### Task 2: Feature-unlock predicate (`unlocks.ts`)

**Files:**
- Create: `src/ui/unlocks.ts`
- Test: `test/unlocks.test.ts`

**Interfaces:**
- Consumes: `GameState` from `src/state/types.ts`.
- Produces:
  - `export const FEATURES: readonly Feature[]`
  - `export type Feature = "status" | "hunger" | "arena" | "training" | "greed" | "trials" | "skills" | "prestige"`
  - `export function isUnlocked(feature: Feature, state: GameState): boolean`

- [ ] **Step 1: Write the failing test**

Create `test/unlocks.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { defaultState } from "../src/state/store";
import { isUnlocked } from "../src/ui/unlocks";

describe("isUnlocked", () => {
  it("always unlocks the Phase-1 live features", () => {
    const s = defaultState();
    expect(isUnlocked("status", s)).toBe(true);
    expect(isUnlocked("hunger", s)).toBe(true);
  });

  it("locks Phase-2 combat features on a fresh save", () => {
    const s = defaultState();
    expect(isUnlocked("arena", s)).toBe(false);
    expect(isUnlocked("training", s)).toBe(false);
  });

  it("locks deep systems on a fresh save", () => {
    const s = defaultState();
    expect(isUnlocked("greed", s)).toBe(false);
    expect(isUnlocked("trials", s)).toBe(false);
    expect(isUnlocked("skills", s)).toBe(false);
    expect(isUnlocked("prestige", s)).toBe(false);
  });

  it("unlocks prestige once sin essence has been earned", () => {
    const s = defaultState();
    s.sinEssence = s.sinEssence.add(1);
    expect(isUnlocked("prestige", s)).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- unlocks`
Expected: FAIL — cannot resolve `../src/ui/unlocks`.

- [ ] **Step 3: Write the implementation**

Create `src/ui/unlocks.ts`:

```ts
import { GameState } from "../state/types";

export type Feature = "status" | "hunger" | "arena" | "training" | "greed" | "trials" | "skills" | "prestige";

export const FEATURES: readonly Feature[] = [
  "status", "hunger", "arena", "training", "greed", "trials", "skills", "prestige",
];

/**
 * Single source of truth for what is visible/active. Future phases flip these
 * predicates on by adding state conditions here — no other file changes needed.
 */
export function isUnlocked(feature: Feature, state: GameState): boolean {
  switch (feature) {
    case "status":
    case "hunger":
      return true; // live since Phase 1
    case "arena":
    case "training":
      return false; // Phase 2 — combat & devour engine
    case "greed":
      return state.greed.bloodCharge.gt(0); // Phase 4
    case "trials":
      return Object.keys(state.sinTrials).length > 0; // Phase 6
    case "skills":
      return Object.keys(state.skills).length > 0; // Phase 6
    case "prestige":
      return state.sinEssence.gt(0) || state.devourerRank > 0; // Phase 5
    default:
      return false;
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- unlocks`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/ui/unlocks.ts test/unlocks.test.ts
git commit -m "feat: add feature-unlock predicate as single gating source"
```

---

### Task 3: Tooltip copy registry (`tooltips.ts`)

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
    expect(getTooltip("does-not-exist")).toBeNull();
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
  souls: { title: "Souls", body: "Harvested from the devoured. Spent to train your stats and fuel your hunger." },
  hunger: { title: "Hunger", body: "Rises as you devour. At its peak, every kill yields double Souls. It drains over time — reduced by MND." },
  gluttony: { title: "Gluttony", body: "Your skill's growth tier. Higher levels deepen every multiplier you command." },
  "hard-reset": { title: "Hard Reset", body: "Wipes ALL progress and starts the feast anew. There is no undo." },
  "stat-STR": { title: "STR — Strength", body: "Physical attack power. Raises your damage against the devoured." },
  "stat-VIT": { title: "VIT — Vitality", body: "Endurance. Gates how deep into the zones you can safely hunt." },
  "stat-AGI": { title: "AGI — Agility", body: "Attack speed. Works with Frenzy to strike faster." },
  "stat-DEX": { title: "DEX — Dexterity", body: "Critical strength. Increases your critical-hit multiplier." },
  "stat-MAG": { title: "MAG — Magic", body: "Magical attack power. Adds to your total damage output." },
  "stat-MND": { title: "MND — Mind", body: "Slows hunger's drain and quickens the absorption of stolen stats." },
  "tab-greed": { title: "Greed (Phase 4)", body: "A sentient hunger you feed with blood to unlock escalating forms." },
  "tab-trials": { title: "Sin Trials (Phase 6)", body: "Optional challenges that grant permanent rewards when cleared." },
  "tab-skills": { title: "Skills (Phase 6)", body: "Abilities devoured from fallen enemies. Equip them for new power." },
  "tab-prestige": { title: "Prestige (Phase 5)", body: "Feeding Frenzy and beyond — reset for Sin Essence and lasting strength." },
};

export function getTooltip(id: string): TooltipCopy | null {
  return TOOLTIPS[id] ?? null;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- tooltips`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/ui/tooltips.ts test/tooltips.test.ts
git commit -m "feat: add tooltip copy registry"
```

---

### Task 4: UI preferences persistence (`uiPrefs.ts`)

**Files:**
- Create: `src/ui/uiPrefs.ts`
- Test: `test/uiPrefs.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `export interface UiPrefs { welcomeSeen: boolean; hintsSeen: string[]; collapseLeft: boolean; collapseRight: boolean }`
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
    const parsed = parseUiPrefs(JSON.stringify({ welcomeSeen: true, hintsSeen: ["a"] }));
    expect(parsed.welcomeSeen).toBe(true);
    expect(parsed.hintsSeen).toEqual(["a"]);
    expect(parsed.collapseLeft).toBe(false);
    expect(parsed.collapseRight).toBe(false);
  });

  it("drops non-string hint ids", () => {
    const parsed = parseUiPrefs(JSON.stringify({ hintsSeen: ["ok", 5, null] }));
    expect(parsed.hintsSeen).toEqual(["ok"]);
  });

  it("round-trips through serialize", () => {
    const prefs = { welcomeSeen: true, hintsSeen: ["x", "y"], collapseLeft: true, collapseRight: false };
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
export interface UiPrefs {
  welcomeSeen: boolean;
  hintsSeen: string[];
  collapseLeft: boolean;
  collapseRight: boolean;
}

const STORAGE_KEY = "gluttony.ui";

export function defaultUiPrefs(): UiPrefs {
  return { welcomeSeen: false, hintsSeen: [], collapseLeft: false, collapseRight: false };
}

export function parseUiPrefs(raw: string | null): UiPrefs {
  const base = defaultUiPrefs();
  if (!raw) return base;
  try {
    const o = JSON.parse(raw);
    if (!o || typeof o !== "object") return base;
    return {
      welcomeSeen: typeof o.welcomeSeen === "boolean" ? o.welcomeSeen : base.welcomeSeen,
      hintsSeen: Array.isArray(o.hintsSeen)
        ? o.hintsSeen.filter((x: unknown): x is string => typeof x === "string")
        : base.hintsSeen,
      collapseLeft: typeof o.collapseLeft === "boolean" ? o.collapseLeft : base.collapseLeft,
      collapseRight: typeof o.collapseRight === "boolean" ? o.collapseRight : base.collapseRight,
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

### Task 5: Just-in-time hint registry (`hints.ts`)

**Files:**
- Create: `src/ui/hints.ts`
- Test: `test/hints.test.ts`

**Interfaces:**
- Consumes: `GameState` (`src/state/types.ts`); `Feature`, `isUnlocked` (`src/ui/unlocks.ts`).
- Produces:
  - `export interface Hint { id: string; feature: Feature; text: string }`
  - `export const HINTS: Hint[]`
  - `export function pendingHints(state: GameState, seen: string[]): Hint[]`

- [ ] **Step 1: Write the failing test**

Create `test/hints.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { defaultState } from "../src/state/store";
import { pendingHints } from "../src/ui/hints";

describe("pendingHints", () => {
  it("returns only hints whose feature is unlocked and not yet seen", () => {
    const s = defaultState();
    const ids = pendingHints(s, []).map((h) => h.id);
    expect(ids).toContain("hunger-intro"); // hunger is unlocked in Phase 1
    expect(ids).not.toContain("arena-unlocked"); // arena is locked in Phase 1
  });

  it("excludes hints already marked seen", () => {
    const s = defaultState();
    const ids = pendingHints(s, ["hunger-intro"]).map((h) => h.id);
    expect(ids).not.toContain("hunger-intro");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- hints`
Expected: FAIL — cannot resolve `../src/ui/hints`.

- [ ] **Step 3: Write the implementation**

Create `src/ui/hints.ts`:

```ts
import { GameState } from "../state/types";
import { Feature, isUnlocked } from "./unlocks";

export interface Hint {
  id: string;
  feature: Feature;
  text: string;
}

export const HINTS: Hint[] = [
  { id: "hunger-intro", feature: "hunger", text: "Hunger rises as you devour. At its peak, every kill feeds you double Souls — but it drains over time." },
  { id: "arena-unlocked", feature: "arena", text: "The hunt begins. Strike the enemy before you, then devour what remains." },
  { id: "greed-stirs", feature: "greed", text: "Greed stirs within you. Feed it blood to unlock its forms." },
];

/** Hints whose feature is currently unlocked and which the player has not dismissed. */
export function pendingHints(state: GameState, seen: string[]): Hint[] {
  return HINTS.filter((h) => isUnlocked(h.feature, state) && !seen.includes(h.id));
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- hints`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/ui/hints.ts test/hints.test.ts
git commit -m "feat: add just-in-time hint registry"
```

---

### Task 6: Tooltip component (`Tooltip.tsx`)

**Files:**
- Create: `src/ui/Tooltip.tsx`

**Interfaces:**
- Consumes: `getTooltip` (`src/ui/tooltips.ts`).
- Produces: `export function Tooltip(props: { id: string; children: ReactNode }): JSX.Element`. Renders children wrapped in a focusable hover-tooltip host; if the id is unknown, renders children unwrapped.

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

- [ ] **Step 2: Verify it typechecks/builds**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/ui/Tooltip.tsx
git commit -m "feat: add hover/focus Tooltip component"
```

---

### Task 7: Hunger meter component (`HungerBar.tsx`)

**Files:**
- Create: `src/ui/HungerBar.tsx`

**Interfaces:**
- Consumes: `.meter` CSS classes from Task 1.
- Produces: `export function HungerBar(props: { value: number; max: number }): JSX.Element`.

- [ ] **Step 1: Write the component**

Create `src/ui/HungerBar.tsx`:

```tsx
export function HungerBar({ value, max }: { value: number; max: number }) {
  const ratio = max > 0 ? Math.min(1, value / max) : 0;
  const full = ratio >= 1;
  return (
    <div className={"meter" + (full ? " meter--full" : "")} role="meter" aria-label="Hunger" aria-valuenow={Math.round(ratio * 100)}>
      <div className="meter__fill" style={{ width: `${ratio * 100}%` }} />
    </div>
  );
}
```

- [ ] **Step 2: Verify it builds**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/ui/HungerBar.tsx
git commit -m "feat: add HungerBar meter component"
```

---

### Task 8: UI prefs store (`useUiPrefs.ts`)

**Files:**
- Create: `src/ui/useUiPrefs.ts`

**Interfaces:**
- Consumes: `UiPrefs`, `loadUiPrefs`, `saveUiPrefs` (`src/ui/uiPrefs.ts`); `create` from `zustand`.
- Produces: `export const useUiPrefs` — a Zustand hook exposing `UiPrefs` fields plus `dismissWelcome(): void`, `markHintSeen(id: string): void`, `toggleCollapse(side: "left" | "right"): void`. Every mutation persists via `saveUiPrefs`.

- [ ] **Step 1: Write the store**

Create `src/ui/useUiPrefs.ts`:

```tsx
import { create } from "zustand";
import { UiPrefs, loadUiPrefs, saveUiPrefs } from "./uiPrefs";

interface UiPrefsStore extends UiPrefs {
  dismissWelcome: () => void;
  markHintSeen: (id: string) => void;
  toggleCollapse: (side: "left" | "right") => void;
}

function persist(s: UiPrefs): void {
  saveUiPrefs({
    welcomeSeen: s.welcomeSeen,
    hintsSeen: s.hintsSeen,
    collapseLeft: s.collapseLeft,
    collapseRight: s.collapseRight,
  });
}

export const useUiPrefs = create<UiPrefsStore>((set, get) => ({
  ...loadUiPrefs(),
  dismissWelcome: () => {
    set({ welcomeSeen: true });
    persist(get());
  },
  markHintSeen: (id) => {
    if (get().hintsSeen.includes(id)) return;
    set({ hintsSeen: [...get().hintsSeen, id] });
    persist(get());
  },
  toggleCollapse: (side) => {
    if (side === "left") set({ collapseLeft: !get().collapseLeft });
    else set({ collapseRight: !get().collapseRight });
    persist(get());
  },
}));
```

- [ ] **Step 2: Verify it builds**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/ui/useUiPrefs.ts
git commit -m "feat: add Zustand store for persisted UI prefs"
```

---

### Task 9: Resource bar (`ResourceBar.tsx`)

**Files:**
- Create: `src/ui/ResourceBar.tsx`
- Modify: `src/ui/styles.css` (append resource-bar classes)

**Interfaces:**
- Consumes: `game` (`src/engine/game.ts`), `format` (`src/engine/format.ts`), `HungerBar`, `Tooltip`.
- Produces: `export function ResourceBar(props: { onHelp: () => void; onToggleLeft: () => void; onToggleRight: () => void }): JSX.Element`. Renders the top bar (grid area `top`) showing live Souls, Hunger, Gluttony, plus collapse/help controls.

- [ ] **Step 1: Append resource-bar CSS**

Append to `src/ui/styles.css`:

```css
.area-top { grid-area: top; }
.resourcebar { display: flex; align-items: center; gap: 20px; }
.resource { display: flex; align-items: center; gap: 8px; }
.hungerbar-slot { width: 120px; }
.resourcebar__spacer { margin-left: auto; }
```

- [ ] **Step 2: Write the component**

Create `src/ui/ResourceBar.tsx`:

```tsx
import { game } from "../engine/game";
import { format } from "../engine/format";
import { HungerBar } from "./HungerBar";
import { Tooltip } from "./Tooltip";

export function ResourceBar({
  onHelp,
  onToggleLeft,
  onToggleRight,
}: {
  onHelp: () => void;
  onToggleLeft: () => void;
  onToggleRight: () => void;
}) {
  const s = game.state;
  return (
    <header className="panel area-top resourcebar">
      <Tooltip id="souls">
        <span className="resource">
          <span className="muted">Souls</span>
          <span>{format(s.souls)}</span>
        </span>
      </Tooltip>
      <Tooltip id="hunger">
        <span className="resource">
          <span className="muted">Hunger</span>
          <span className="hungerbar-slot">
            <HungerBar value={s.hunger} max={s.hungerMax} />
          </span>
        </span>
      </Tooltip>
      <Tooltip id="gluttony">
        <span className="resource">
          <span className="muted">Gluttony</span>
          <span>Lv {format(s.gluttonyLevel)}</span>
        </span>
      </Tooltip>
      <span className="resourcebar__spacer" />
      <button className="btn icon-btn" onClick={onToggleLeft} aria-label="Toggle status panel">‹</button>
      <button className="btn icon-btn" onClick={onHelp} aria-label="Help">?</button>
      <button className="btn icon-btn" onClick={onToggleRight} aria-label="Toggle actions panel">›</button>
    </header>
  );
}
```

- [ ] **Step 3: Verify it builds**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/ui/ResourceBar.tsx src/ui/styles.css
git commit -m "feat: add resource bar with live Souls/Hunger/Gluttony"
```

---

### Task 10: Status panel (`StatusPanel.tsx`)

**Files:**
- Create: `src/ui/StatusPanel.tsx`
- Modify: `src/ui/styles.css` (append `.area-left`)

**Interfaces:**
- Consumes: `game` (`src/engine/game.ts`), `format`, `STAT_ORDER` (`src/state/types.ts`), `Tooltip`.
- Produces: `export function StatusPanel(): JSX.Element` — grid area `left`; the six stats read-only, with a locked Training badge.

- [ ] **Step 1: Append CSS**

Append to `src/ui/styles.css`:

```css
.area-left { grid-area: left; display: flex; flex-direction: column; gap: 8px; }
.locked-box { margin-top: 12px; padding: 10px; border: 1px solid var(--border); border-radius: 8px; }
```

- [ ] **Step 2: Write the component**

Create `src/ui/StatusPanel.tsx`:

```tsx
import { game } from "../engine/game";
import { format } from "../engine/format";
import { STAT_ORDER } from "../state/types";
import { Tooltip } from "./Tooltip";

export function StatusPanel() {
  const s = game.state;
  return (
    <section className="panel area-left">
      <h2 className="panel__title">[ Status ]</h2>
      {STAT_ORDER.map((id) => (
        <Tooltip key={id} id={`stat-${id}`}>
          <div className="row">
            <span className="muted">{id}</span>
            <span>{format(s.stats[id].value)}</span>
          </div>
        </Tooltip>
      ))}
      <div className="locked locked-box">
        <span className="locked__badge">🔒 Training — arrives Phase 2</span>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Verify it builds**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/ui/StatusPanel.tsx src/ui/styles.css
git commit -m "feat: add Status panel with read-only stats and locked training"
```

---

### Task 11: Devour arena (`DevourArena.tsx`)

**Files:**
- Create: `src/ui/DevourArena.tsx`
- Modify: `src/ui/styles.css` (append arena classes)

**Interfaces:**
- Consumes: arena CSS classes.
- Produces: `export function DevourArena(): JSX.Element` — grid area `center`; locked placeholder for Phase 2 combat over a faint maw motif.

- [ ] **Step 1: Append CSS**

Append to `src/ui/styles.css`:

```css
.area-center { grid-area: center; display: flex; }
.arena {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.arena__maw {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 180px;
  opacity: 0.05;
  pointer-events: none;
}
.arena__copy { max-width: 320px; }
```

- [ ] **Step 2: Write the component**

Create `src/ui/DevourArena.tsx`:

```tsx
export function DevourArena() {
  return (
    <section className="panel area-center">
      <div className="arena locked">
        <div className="arena__maw" aria-hidden="true">☠</div>
        <h2 className="panel__title">~ The Devoured ~</h2>
        <p className="locked__badge">🔒 The hunt begins — Phase 2</p>
        <p className="muted arena__copy">
          Enemies will rise here to be struck down and devoured — for their Souls, their stats, and their skills.
        </p>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Verify it builds**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/ui/DevourArena.tsx src/ui/styles.css
git commit -m "feat: add locked Devour arena placeholder"
```

---

### Task 12: Actions panel (`ActionsPanel.tsx`)

**Files:**
- Create: `src/ui/ActionsPanel.tsx`
- Modify: `src/ui/styles.css` (append `.area-right`)

**Interfaces:**
- Consumes: `hardReset` (`src/engine/game.ts`), `Tooltip`.
- Produces: `export function ActionsPanel(): JSX.Element` — grid area `right`; live Hard Reset (with confirm) + locked Phase-2 actions.

- [ ] **Step 1: Append CSS**

Append to `src/ui/styles.css`:

```css
.area-right { grid-area: right; display: flex; flex-direction: column; gap: 12px; }
```

- [ ] **Step 2: Write the component**

Create `src/ui/ActionsPanel.tsx`:

```tsx
import { hardReset } from "../engine/game";
import { Tooltip } from "./Tooltip";

export function ActionsPanel() {
  return (
    <section className="panel area-right">
      <h2 className="panel__title">[ Actions ]</h2>
      <div className="locked locked-box">
        <span className="locked__badge">🔒 Devour & Frenzy — arrives Phase 2</span>
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

- [ ] **Step 3: Verify it builds**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/ui/ActionsPanel.tsx src/ui/styles.css
git commit -m "feat: add Actions panel with live Hard Reset and locked actions"
```

---

### Task 13: Tab rail (`TabRail.tsx`)

**Files:**
- Create: `src/ui/TabRail.tsx`
- Modify: `src/ui/styles.css` (append tab classes)

**Interfaces:**
- Consumes: `game` (`src/engine/game.ts`), `Feature`, `isUnlocked` (`src/ui/unlocks.ts`), `Tooltip`.
- Produces: `export function TabRail(): JSX.Element` — grid area `tabs`; an active Combat tab plus locked/disabled tabs for greed/trials/skills/prestige, each driven by `isUnlocked`.

- [ ] **Step 1: Append CSS**

Append to `src/ui/styles.css`:

```css
.area-tabs { grid-area: tabs; }
.tabrail { display: flex; gap: 8px; flex-wrap: wrap; }
.tab { flex: 0 0 auto; }
.tab--active { border-color: var(--accent); color: var(--accent); box-shadow: var(--glow); }
```

- [ ] **Step 2: Write the component**

Create `src/ui/TabRail.tsx`:

```tsx
import { game } from "../engine/game";
import { Feature, isUnlocked } from "./unlocks";
import { Tooltip } from "./Tooltip";

const TABS: { feature: Feature; label: string }[] = [
  { feature: "greed", label: "Greed" },
  { feature: "trials", label: "Sin Trials" },
  { feature: "skills", label: "Skills" },
  { feature: "prestige", label: "Prestige" },
];

export function TabRail() {
  const s = game.state;
  return (
    <nav className="panel area-tabs tabrail">
      <button className="btn tab tab--active">Combat</button>
      {TABS.map((t) => {
        const unlocked = isUnlocked(t.feature, s);
        return (
          <Tooltip key={t.feature} id={`tab-${t.feature}`}>
            <button className={"btn tab" + (unlocked ? "" : " locked")} disabled={!unlocked}>
              {unlocked ? t.label : `🔒 ${t.label}`}
            </button>
          </Tooltip>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 3: Verify it builds**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/ui/TabRail.tsx src/ui/styles.css
git commit -m "feat: add tab rail with unlock-gated deep-system tabs"
```

---

### Task 14: Onboarding (`WelcomeModal.tsx` + `HintBeacon.tsx`)

**Files:**
- Create: `src/ui/onboarding/WelcomeModal.tsx`
- Create: `src/ui/onboarding/HintBeacon.tsx`

**Interfaces:**
- Consumes: modal/beacon CSS from Task 1; `useState` from React.
- Produces:
  - `export function WelcomeModal(props: { onBegin: () => void }): JSX.Element`
  - `export function HintBeacon(props: { text: string; onDismiss: () => void }): JSX.Element` — a fixed-corner pulsing beacon; click toggles a popover with a "Got it" dismiss.

- [ ] **Step 1: Write the welcome modal**

Create `src/ui/onboarding/WelcomeModal.tsx`:

```tsx
export function WelcomeModal({ onBegin }: { onBegin: () => void }) {
  return (
    <div className="modal__scrim" role="dialog" aria-modal="true">
      <section className="panel modal">
        <h1 className="panel__title">The Skill [ Gluttony ]</h1>
        <p className="modal__lore">
          A hunger awakens within you — bottomless, eternal.
          <br />
          Devour your enemies. Take their Souls, their strength, their very skills.
          <br />
          Grow. Consume. Never be sated.
        </p>
        <button className="btn" onClick={onBegin}>Begin the Feast</button>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Write the hint beacon**

Create `src/ui/onboarding/HintBeacon.tsx`:

```tsx
import { useState } from "react";

export function HintBeacon({ text, onDismiss }: { text: string; onDismiss: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="tip beacon-host">
      <button className="beacon" aria-label="New hint" onClick={() => setOpen((o) => !o)} />
      {open && (
        <span className="tip__pop" style={{ opacity: 1, visibility: "visible" }} role="status">
          <p className="tip__body">{text}</p>
          <button
            className="btn"
            style={{ marginTop: 8, fontSize: 11, padding: "4px 8px" }}
            onClick={() => {
              setOpen(false);
              onDismiss();
            }}
          >
            Got it
          </button>
        </span>
      )}
    </span>
  );
}
```

- [ ] **Step 3: Verify it builds**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/ui/onboarding/WelcomeModal.tsx src/ui/onboarding/HintBeacon.tsx
git commit -m "feat: add welcome lore modal and hint beacon"
```

---

### Task 15: Compose the shell & wire it in (`AppShell.tsx`)

**Files:**
- Create: `src/ui/AppShell.tsx`
- Modify: `src/ui/styles.css` (append grid + responsive rules)
- Modify: `src/App.tsx` (render `<AppShell />`)
- Delete: `src/ui/StatusWindow.tsx`

**Interfaces:**
- Consumes: `useRender` (`src/state/store.ts`), `game` (`src/engine/game.ts`), `useUiPrefs`, `pendingHints` (`src/ui/hints.ts`), and every region/onboarding component from Tasks 9–14.
- Produces: `export function AppShell(): JSX.Element` — the full grid, re-rendering each tick, applying collapse classes, and showing the welcome modal / first pending hint.

- [ ] **Step 1: Append grid + responsive CSS**

Append to `src/ui/styles.css`:

```css
.app-shell {
  display: grid;
  height: 100%;
  gap: var(--gap);
  padding: var(--gap);
  grid-template-columns: minmax(220px, 1fr) 2.2fr minmax(220px, 1fr);
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "top top top"
    "left center right"
    "tabs tabs tabs";
}
.app-shell.collapse-left { grid-template-columns: 0 2.2fr minmax(220px, 1fr); }
.app-shell.collapse-right { grid-template-columns: minmax(220px, 1fr) 2.2fr 0; }
.app-shell.collapse-left.collapse-right { grid-template-columns: 0 1fr 0; }
.collapse-left .area-left,
.collapse-right .area-right { display: none; }

@media (max-width: 900px) {
  .app-shell,
  .app-shell.collapse-left,
  .app-shell.collapse-right {
    grid-template-columns: 1fr;
    grid-template-areas:
      "top"
      "center"
      "left"
      "right"
      "tabs";
  }
  .collapse-left .area-left,
  .collapse-right .area-right { display: flex; }
}
```

- [ ] **Step 2: Write the shell**

Create `src/ui/AppShell.tsx`:

```tsx
import { useState } from "react";
import { useRender } from "../state/store";
import { game } from "../engine/game";
import { useUiPrefs } from "./useUiPrefs";
import { pendingHints } from "./hints";
import { ResourceBar } from "./ResourceBar";
import { StatusPanel } from "./StatusPanel";
import { DevourArena } from "./DevourArena";
import { ActionsPanel } from "./ActionsPanel";
import { TabRail } from "./TabRail";
import { WelcomeModal } from "./onboarding/WelcomeModal";
import { HintBeacon } from "./onboarding/HintBeacon";

export function AppShell() {
  useRender((s) => s.frame); // re-render each tick to sample live game state
  const prefs = useUiPrefs();
  const [showHelp, setShowHelp] = useState(false);

  const firstHint = pendingHints(game.state, prefs.hintsSeen)[0];
  const cls =
    "app-shell" +
    (prefs.collapseLeft ? " collapse-left" : "") +
    (prefs.collapseRight ? " collapse-right" : "");

  return (
    <div className={cls}>
      <ResourceBar
        onHelp={() => setShowHelp(true)}
        onToggleLeft={() => prefs.toggleCollapse("left")}
        onToggleRight={() => prefs.toggleCollapse("right")}
      />
      <StatusPanel />
      <DevourArena />
      <ActionsPanel />
      <TabRail />

      {firstHint && <HintBeacon text={firstHint.text} onDismiss={() => prefs.markHintSeen(firstHint.id)} />}
      {(!prefs.welcomeSeen || showHelp) && (
        <WelcomeModal
          onBegin={() => {
            prefs.dismissWelcome();
            setShowHelp(false);
          }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Point App.tsx at the shell**

Replace the entire contents of `src/App.tsx` with:

```tsx
import { AppShell } from "./ui/AppShell";

export function App() {
  return <AppShell />;
}
```

- [ ] **Step 4: Delete the superseded StatusWindow**

Run:

```bash
git rm src/ui/StatusWindow.tsx
```

- [ ] **Step 5: Verify the full build and tests**

Run: `npm run build && npm test`
Expected: build exits 0; all tests pass (the original `scaffold.test.ts` plus the four new suites — 13 tests total).

- [ ] **Step 6: Manual visual verification**

Run: `npm run dev` and open the served URL. Confirm:
- First load shows the "The Skill [ Gluttony ]" lore modal; "Begin the Feast" dismisses it and it does not reappear on reload.
- The console fills the screen: top resource bar (Souls / Hunger meter / Gluttony), Status (six stats + locked Training), centered locked Devour arena, Actions (locked + Hard Reset), bottom tab rail (Combat active; Greed/Sin Trials/Skills/Prestige locked).
- Hovering Souls/Hunger/Gluttony/stats/locked tabs shows crimson tooltips; keyboard-focusing them shows the same.
- The `‹` and `›` buttons collapse/restore the side columns; the choice survives a reload.
- A pulsing hint beacon (bottom-right) opens the Hunger hint; "Got it" dismisses it permanently.
- Narrow the window below 900px: the layout stacks into one column.

- [ ] **Step 7: Commit**

```bash
git add src/ui/AppShell.tsx src/ui/styles.css src/App.tsx
git commit -m "feat: compose full-screen Command Console shell and retire StatusWindow"
```

---

## Self-Review

**1. Spec coverage** (against the approved design):
- Crimson & Obsidian theme → Task 1 (tokens) applied throughout.
- Full-screen Command Console layout (top bar / 3 cols / tab rail, collapsible, responsive) → Tasks 9–13, 15.
- Progressive disclosure / locked placeholders → `unlocks.ts` (Task 2) consumed by Status (10), Arena (11), Actions (12), TabRail (13).
- Lore intro + just-in-time hints → Tasks 5, 14, 15.
- Hover **and** keyboard tooltips → Tasks 3, 6; applied in 9, 10, 13.
- Live Phase-1 data only (Souls/Hunger/Gluttony) → Task 9; Hard Reset → Task 12.
- Onboarding state in separate `gluttony.ui` key, game save untouched → Tasks 4, 8.
- `styles.css` + class-name approach enabling hover/animation/responsive → Task 1 + appends.
- Tests stay node-only/pure; UI gated by build → encoded in Global Constraints and every task's gate.

**2. Placeholder scan:** No "TBD"/"TODO"/"handle edge cases"/"similar to Task N" — every code and test block is complete and inlined.

**3. Type consistency:** `Feature` and `isUnlocked` (Task 2) reused verbatim in `hints.ts` (5) and `TabRail.tsx` (13). `UiPrefs` (Task 4) consumed by `useUiPrefs.ts` (8) with matching field names. `getTooltip`/`TooltipCopy` (3) consumed by `Tooltip.tsx` (6). `pendingHints(state, seen)` signature consistent between Task 5 and its caller in Task 15. Component prop shapes match their call sites (`ResourceBar` props ↔ AppShell; `HintBeacon`/`WelcomeModal` props ↔ AppShell).

No gaps found.
