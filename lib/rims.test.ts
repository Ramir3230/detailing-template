import { describe, expect, it } from "vitest";
import type { Service } from "@/content/types";
import { defaultRim, groupRims, rimAmounts, rimFraction } from "./rims";

describe("rimAmounts", () => {
  it("orders the sizes by rim, not by how the data lists them", () => {
    expect(rimAmounts({ kind: "byRim", rims: { R19: 60, R15: 40, R17: 50 } })).toEqual([
      { size: "R15", amount: 40 },
      { size: "R17", amount: 50 },
      { size: "R19", amount: 60 },
    ]);
  });
});

describe("groupRims", () => {
  const service = (price: Service["price"]): Service => ({ name: { pl: "x" }, price });

  it("takes the sizes of the group's price by rim", () => {
    expect(
      groupRims([service({ kind: "fixed", amount: 5 }), service({ kind: "byRim", rims: { R16: 45, R15: 40 } })]),
    ).toEqual(["R15", "R16"]);
  });

  it("is null for a group without one: no rim switch there", () => {
    expect(groupRims([service({ kind: "from", amount: 100 })])).toBeNull();
  });
});

describe("defaultRim", () => {
  it("starts in the middle of the row, the lower middle when it is even", () => {
    expect(defaultRim(5)).toBe(2);
    expect(defaultRim(4)).toBe(1);
    expect(defaultRim(2)).toBe(0);
  });
});

describe("rimFraction", () => {
  it("grows the rim across the studio's row of sizes, inside the tyre", () => {
    const sizes = ["R15", "R16", "R17", "R18", "R19"] as const;
    [0.5, 0.575, 0.65, 0.725, 0.8].forEach((fraction, i) => expect(rimFraction(sizes[i], sizes)).toBeCloseTo(fraction, 9));
    expect(rimFraction("R20", ["R20", "R21"])).toBeCloseTo(0.5, 9);
    expect(rimFraction("R21", ["R20", "R21"])).toBeCloseTo(0.8, 9);
  });
});
