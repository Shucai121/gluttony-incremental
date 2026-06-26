import { Decimal } from "./decimal";

const KEY = "bog-incremental-save";

// Walk the LIVE object first (so instanceof works regardless of Decimal.toJSON, which
// break_eternity DOES define — a naive JSON.stringify replacer would never see a Decimal).
export function encode(v: any): any {
  if (v instanceof Decimal) return { __dec: v.toString() };
  if (Array.isArray(v)) return v.map(encode);
  if (v && typeof v === "object") {
    const o: any = {};
    for (const k in v) o[k] = encode(v[k]);
    return o;
  }
  return v;
}

export function decode(v: any): any {
  if (Array.isArray(v)) return v.map(decode);
  if (v && typeof v === "object") {
    if (typeof v.__dec === "string") return new Decimal(v.__dec);
    const o: any = {};
    for (const k in v) o[k] = decode(v[k]);
    return o;
  }
  return v;
}

// localStorage is browser-only; the engine also imports under node (tests, SSR).
function storage(): Storage | null {
  return typeof localStorage === "undefined" ? null : localStorage;
}

export function saveGame(state: unknown): void {
  storage()?.setItem(KEY, JSON.stringify(encode(state)));
}

export function loadRaw(): any | null {
  const s = storage()?.getItem(KEY);
  return s ? decode(JSON.parse(s)) : null;
}

export function clearSave(): void {
  storage()?.removeItem(KEY);
}
