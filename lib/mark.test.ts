import { describe, expect, it } from "vitest";
import { markShapes, tubeStrikes, tubeTimings } from "./mark";

const svg = (body: string, box = 'viewBox="0 0 100 80"') =>
  `<svg xmlns="http://www.w3.org/2000/svg" ${box} width="100" height="80">${body}</svg>`;

describe("markShapes", () => {
  it("reads the tubes in file order with the stroke they carry", () => {
    const shapes = markShapes(
      svg(
        '<path d="M10 10 L90 10" fill="none" stroke="#ff2d95" stroke-width="4" stroke-linecap="round"/>\n' +
          "<path d='M10 40 H90' fill='none' stroke='#ffffff' stroke-width='3'/>",
      ),
    );
    expect(shapes).toEqual({
      kind: "tubes",
      viewBox: "0 0 100 80",
      tubes: [
        { d: "M10 10 L90 10", stroke: "#ff2d95", strokeWidth: "4", strokeLinecap: "round" },
        { d: "M10 40 H90", stroke: "#ffffff", strokeWidth: "3" },
      ],
    });
  });

  it("leaves a filled mark to light up whole", () => {
    expect(markShapes(svg('<path fill="#ff6a3d" d="M62 8 A44 44 0 1 0 92 70 Z"/>'))).toEqual({ kind: "fill" });
    // Без fill="none" у самого контура — заливка, даже с обводкой
    expect(markShapes(svg('<path d="M0 0 H10" stroke="#fff"/>'))).toEqual({ kind: "fill" });
    expect(markShapes(svg('<path d="M0 0 H10" fill="none" stroke="none"/>'))).toEqual({ kind: "fill" });
  });

  it("refuses tubes the hero would draw unlike the header", () => {
    const tube = '<path d="M0 0 H10" fill="none" stroke="#fff"/>';
    const reasons = [
      svg(`${tube}<path d="M0 5 H10" fill="#fff"/>`),
      svg(`${tube}<circle cx="5" cy="5" r="4" fill="none" stroke="#fff"/>`),
      svg(`<g stroke-linecap="round">${tube}</g>`),
      svg(`<path d="M0 0 H10" fill="none" stroke="#fff" transform="scale(2)"/>`),
      svg(`<path d="M0 0 H10" fill="none" stroke="#fff" filter="url(#glow)"/>`),
      svg('<path fill="none" stroke="#fff"/>'),
      svg(tube, ""),
    ].map((file) => markShapes(file));
    for (const shapes of reasons) expect(shapes.kind).toBe("invalid");
  });
});

describe("tubeTimings", () => {
  it("runs a single tube through the whole window", () => {
    expect(tubeTimings(1)).toEqual([{ delay: 1.3, run: 0.9 }]);
  });

  it("starts each tube before the previous one has finished and ends with the mark strike", () => {
    const timings = tubeTimings(4);
    expect(timings[0].delay).toBeCloseTo(1.3, 6);
    for (let i = 1; i < timings.length; i++) {
      expect(timings[i].delay).toBeGreaterThan(timings[i - 1].delay);
      expect(timings[i].delay).toBeLessThan(timings[i - 1].delay + timings[i - 1].run);
    }
    const last = timings[timings.length - 1];
    expect(last.delay + last.run).toBeCloseTo(tubeStrikes.mark, 6);
    expect(tubeStrikes.word).toBeGreaterThan(tubeStrikes.mark);
  });
});
