import { describe, expect, it } from "vitest";
import { getMonthGrid, toISODate, weekdayLabel } from "./date";

describe("date helpers", () => {
  it("builds a monday-first six-week calendar", () => {
    const grid = getMonthGrid(new Date(2026, 7, 1));
    expect(grid).toHaveLength(42);
    expect(grid[0].iso).toBe("2026-07-27");
    expect(grid[41].iso).toBe("2026-09-06");
  });

  it("formats local dates without UTC drift", () => {
    expect(toISODate(new Date(2026, 7, 9))).toBe("2026-08-09");
    expect(weekdayLabel(0)).toBe("周日");
  });
});
