import { describe, it, expect } from "vitest";
import { Decimal } from "../src/engine/decimal";
import { format } from "../src/engine/format";
import { defaultState, deepMerge, migrate } from "../src/state/store";
import { encode, decode } from "../src/engine/save";

describe("big-number math (break_infinity)", () => {
  it("adds beyond JS float range", () => {
    const r = new Decimal("1e500").add("1e500");
    expect(r.exponent).toBe(500);
    expect(r.mantissa).toBeCloseTo(2, 6);
  });

  it("multiplies past 1e308 without becoming Infinity", () => {
    const r = new Decimal("1e308").mul("1e308");
    expect(r.exponent).toBe(616);
    expect(Number.isFinite(r.mantissa)).toBe(true);
  });
});

describe("number formatting", () => {
  it("formats the Infinity cap in scientific notation", () => {
    expect(format(new Decimal("1.8e308"))).toBe("1.80e308");
  });
  it("formats small integers plainly", () => {
    expect(format(new Decimal(50))).toBe("50");
  });
  it("formats zero", () => {
    expect(format(new Decimal(0))).toBe("0");
  });
});

describe("save round-trip (encode/decode via deepMerge)", () => {
  it("revives Decimal fields and preserves values", () => {
    const original = defaultState();
    original.souls = new Decimal("1.23e450");
    original.stats.STR.value = new Decimal("9e99");

    // Real save -> load path: encode() (live-object walk) -> JSON -> decode() (revive Decimals).
    const wire = JSON.parse(JSON.stringify(encode(original)));
    const loaded = deepMerge(defaultState(), migrate(decode(wire)));
    expect(loaded.souls instanceof Decimal).toBe(true);
    expect(loaded.souls.eq(original.souls)).toBe(true);
    expect(loaded.stats.STR.value.eq("9e99")).toBe(true);
  });

  it("falls back to defaults for an empty save", () => {
    const loaded = deepMerge(defaultState(), migrate({}));
    expect(loaded.version).toBe(defaultState().version);
    expect(loaded.souls.eq(0)).toBe(true);
  });
});
