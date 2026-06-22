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
