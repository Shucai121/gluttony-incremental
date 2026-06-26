import { describe, expect, it } from "vitest";
import { Notification, pushCapped } from "../src/ui/notifyQueue";

const n = (id: number): Notification => ({ id, tag: "T", text: `n${id}` });

describe("pushCapped", () => {
  it("appends under the cap", () => {
    const out = pushCapped([n(1), n(2)], n(3), 4);
    expect(out.map((x) => x.id)).toEqual([1, 2, 3]);
  });

  it("drops the oldest entries past the cap", () => {
    const out = pushCapped([n(1), n(2), n(3), n(4)], n(5), 4);
    expect(out.map((x) => x.id)).toEqual([2, 3, 4, 5]);
  });

  it("does not mutate the input list", () => {
    const input = [n(1)];
    pushCapped(input, n(2), 4);
    expect(input.map((x) => x.id)).toEqual([1]);
  });
});
