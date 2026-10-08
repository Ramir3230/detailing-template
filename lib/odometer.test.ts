import { describe, expect, it } from "vitest";
import { NBSP } from "@/lib/format";
import { rollColumns, splitAmount } from "@/lib/odometer";

describe("splitAmount", () => {
  it("cuts the currency off at the last non-breaking space", () => {
    expect(splitAmount(`1150${NBSP}zł`)).toEqual({ number: "1150", suffix: `${NBSP}zł` });
    expect(splitAmount(`15${NBSP}000${NBSP}zł`)).toEqual({ number: `15${NBSP}000`, suffix: `${NBSP}zł` });
  });
});

describe("rollColumns", () => {
  it("aligns digits to the right and leaves the rest blank", () => {
    expect(rollColumns(["800", "900", "1000"])).toEqual({
      columns: ["digit", "digit", "digit", "digit"],
      positions: [
        [10, 8, 0, 0],
        [10, 9, 0, 0],
        [1, 0, 0, 0],
      ],
    });
  });

  it("keeps the thousands separator out of the strips", () => {
    const rolling = rollColumns([`12${NBSP}000`, `15${NBSP}000`, `120${NBSP}000`]);
    expect(rolling?.columns).toEqual(["digit", "digit", "digit", "separator", "digit", "digit", "digit"]);
    expect(rolling?.positions[1]).toEqual([10, 1, 5, 10, 0, 0, 0]);
  });

  it("gives up on fractions and on separators in different places", () => {
    expect(rollColumns(["99,5", "120", "140"])).toBeNull();
    expect(rollColumns(["9800", `12${NBSP}000`, `14${NBSP}000`])).toBeNull();
  });
});
