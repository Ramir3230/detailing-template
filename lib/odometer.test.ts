import { describe, expect, it } from "vitest";
import { NBSP } from "@/lib/format";
import { splitAmount, stripPositions, stripSymbols } from "@/lib/odometer";

describe("splitAmount", () => {
  it("cuts the currency off at the last non-breaking space", () => {
    expect(splitAmount(`1150${NBSP}zł`)).toEqual({ number: "1150", suffix: `${NBSP}zł` });
    expect(splitAmount(`15${NBSP}000${NBSP}zł`)).toEqual({ number: `15${NBSP}000`, suffix: `${NBSP}zł` });
  });
});

describe("stripPositions", () => {
  it("aligns digits to the right and leaves the rest blank", () => {
    expect(stripPositions("900", 4)).toEqual([11, 9, 0, 0]);
    expect(stripPositions("1000", 4)).toEqual([1, 0, 0, 0]);
  });

  it("keeps the thousands separator on its own position", () => {
    expect(stripPositions(`15${NBSP}000`, 6)).toEqual([1, 5, 10, 0, 0, 0]);
    expect(stripSymbols[10]).toBe(NBSP);
  });
});
