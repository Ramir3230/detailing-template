import { describe, expect, it } from "vitest";
import { approach, brightness, rgb, rotation } from "./car-volume";

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

describe("brightness", () => {
  it("reads the value out of a computed filter", () => {
    expect(brightness("brightness(0.25)")).toBe(0.25);
    expect(brightness("blur(6px) brightness(1.5)")).toBe(1.5);
    expect(brightness("brightness(40%)")).toBe(0.4);
  });

  it("is 1 when there is no brightness in the filter", () => {
    expect(brightness("none")).toBe(1);
    expect(brightness("")).toBe(1);
  });
});

describe("rgb", () => {
  it("reads computed colours", () => {
    expect(rgb("rgb(255, 0, 51)")).toEqual([1, 0, 0.2]);
    expect(rgb("rgba(0, 255, 0, 0.5)")).toEqual([0, 1, 0]);
    expect(rgb("rgb(255 0 51)")).toEqual([1, 0, 0.2]);
  });

  it("gives up on other formats instead of guessing", () => {
    expect(rgb("color(display-p3 1 0 0)")).toBeNull();
    expect(rgb("")).toBeNull();
  });
});
