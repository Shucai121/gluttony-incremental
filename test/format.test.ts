import { afterEach, describe, expect, it } from "vitest";
import { D } from "../src/engine/decimal";
import { format, getNotation, setNotation } from "../src/engine/format";

afterEach(() => setNotation("scientific"));

describe("format notation setting", () => {
  it("defaults to scientific", () => {
    expect(getNotation()).toBe("scientific");
    expect(format(D("1.23e9"))).toBe("1.23e9");
  });

  it("setNotation switches the default used by format", () => {
    setNotation("engineering");
    expect(getNotation()).toBe("engineering");
    // 1.23e9 in engineering notation groups the exponent to a multiple of 3
    expect(format(D("1.23e9"))).toBe("1.23e9");
    expect(format(D("1.23e10"))).toBe("12.30e9");
  });

  it("an explicit notation argument overrides the global setting", () => {
    setNotation("engineering");
    expect(format(D("1.23e10"), "scientific")).toBe("1.23e10");
  });
});

describe("compact exponent for astronomical magnitudes", () => {
  it("leaves moderate exponents in plain scientific", () => {
    expect(format(D("1.23e50000"))).toBe("1.23e50000");
  });

  it("compacts the exponent itself once it grows past ~1e6", () => {
    // 10^1,000,000 — the exponent is itself rendered in scientific (1.00e1.00e6) so the
    // string can never grow without bound and overflow the layout.
    expect(format(D("1e1000000"))).toBe("1.00e1.00e6");
  });

  it("compacts in engineering notation too", () => {
    setNotation("engineering");
    expect(format(D("1e1000002"))).toBe("1.00e1.00e6");
  });
});
