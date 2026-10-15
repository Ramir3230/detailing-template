import { describe, expect, it } from "vitest";
import { approach, rotation, spectrumStops } from "./car-volume";

describe("spectrumStops", () => {
  it("spreads the spectrum across the car, not the 124% floor layer", () => {
    expect(spectrumStops(["#000000", "#ffffff"])).toBe("#000000 9.68%, #ffffff 90.32%");
    expect(spectrumStops(["#000000", "#888888", "#ffffff"])).toBe("#000000 9.68%, #888888 50.00%, #ffffff 90.32%");
  });
});

/* Матрица по столбцам, как в GLSL */
function apply(m: Float32Array, [x, y, z]: [number, number, number]): number[] {
  return [0, 1, 2].map((row) => m[row] * x + m[row + 3] * y + m[row + 6] * z);
}

describe("rotation", () => {
  it("leaves the frame in place at rest", () => {
    // + 0 сводит −0 к 0: для toEqual это разные числа
    expect(Array.from(rotation(0, 0), (v) => v + 0)).toEqual([1, 0, 0, 0, 1, 0, 0, 0, 1]);
  });

  it("turns the front of the car towards the cursor", () => {
    const [x, y] = apply(rotation(5, 3), [0, 0, 1]);
    expect(x).toBeGreaterThan(0);
    expect(y).toBeGreaterThan(0);
    const [left, down] = apply(rotation(-5, -3), [0, 0, 1]);
    expect(left).toBeLessThan(0);
    expect(down).toBeLessThan(0);
  });

  it("keeps lengths: the car turns, it does not stretch", () => {
    const point: [number, number, number] = [0.4, -0.3, 0.2];
    const turned = apply(rotation(7, -4), point);
    expect(Math.hypot(...turned)).toBeCloseTo(Math.hypot(...point), 6);
  });
});

describe("approach", () => {
  it("covers ~63% of the way in tau, whatever the frame rate", () => {
    expect(approach(0, 1, 0.2, 0.2)).toBeCloseTo(1 - Math.exp(-1), 6);
    let stepped = 0;
    for (let i = 0; i < 12; i++) stepped = approach(stepped, 1, 0.2 / 12, 0.2);
    expect(stepped).toBeCloseTo(1 - Math.exp(-1), 6);
  });

  it("never overshoots the target", () => {
    expect(approach(0, 1, 10, 0.1)).toBeLessThanOrEqual(1);
    expect(approach(2, 1, 10, 0.1)).toBeGreaterThanOrEqual(1);
  });
});
