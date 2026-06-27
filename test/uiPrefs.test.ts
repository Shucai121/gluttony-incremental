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
    const prefs = { welcomeSeen: true, seenReveals: ["zone"], hintsSeen: ["a"], statsExpanded: true };
    expect(parseUiPrefs(serializeUiPrefs(prefs))).toEqual(prefs);
  });
});
