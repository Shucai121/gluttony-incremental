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
