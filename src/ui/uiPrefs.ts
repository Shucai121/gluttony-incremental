const STORAGE_KEY = "gluttony.ui";

export interface UiPrefs {
  welcomeSeen: boolean;
  seenReveals: string[];
  hintsSeen: string[];
  statsExpanded: boolean;
}

export function defaultUiPrefs(): UiPrefs {
  return { welcomeSeen: false, seenReveals: [], hintsSeen: [], statsExpanded: false };
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
      statsExpanded: typeof o.statsExpanded === "boolean" ? o.statsExpanded : base.statsExpanded,
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
