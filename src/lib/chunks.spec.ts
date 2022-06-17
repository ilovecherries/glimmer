import { describe, it, expect } from "vitest";
import { pairs, span, spanPair } from "./chunks";

describe("span", () => {
  const isEven = (x: number) => x % 2 === 0;
  it("split halfway condition", () => {
    expect(span([2, 4, 6, 3, 1, 2], isEven)).toEqual([
      [2, 4, 6],
      [3, 1, 2],
    ]);
  });

  it("never split condition", () => {
    expect(span([2, 4, 6, 8, 4, 2], isEven)).toEqual([[2, 4, 6, 8, 4, 2], []]);
  });
});

describe("pairs", () => {
  it("generate no pairs when given 0 elements", () => {
    expect(pairs([])).toEqual([]);
  });
  it("generate single unfinished pair when given 1 element", () => {
    const test = [1];
    expect(pairs(test)).toEqual([[1]]);
  });
  it("generate pairs when given 4 elements", () => {
    const test = [1, 2, 3, 4];
    expect(pairs(test)).toEqual([
      [1, 2],
      [2, 3],
      [3, 4],
    ]);
  });
});

describe("span pairs", () => {
  it("use simple comparison", () => {
    const spanPairTest = (x: number, y: number) => x < y;
    expect(spanPair([1, 2, 3, 4, 3, 2, 1], spanPairTest)).toEqual([
      [1, 2, 3, 4],
      [3, 2, 1],
    ]);
  });
});
