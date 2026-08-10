import { describe, expect, it } from "vitest";
import { getBodyMetricHistory } from "./bodyMetrics";
import type { BodyMetric } from "./types";

const metric = (id: string, date: string, weight: number, bodyFat: number): BodyMetric => ({
  id,
  date,
  weight,
  bodyFat,
  createdAt: `${date}T00:00:00.000Z`,
  updatedAt: `${date}T00:00:00.000Z`,
});

describe("getBodyMetricHistory", () => {
  it("按日期倒序并计算相对上一条记录的变化", () => {
    const result = getBodyMetricHistory([
      metric("second", "2026-08-10", 71.8, 15.9),
      metric("first", "2026-08-01", 72.5, 16.4),
    ]);

    expect(result.map((item) => item.id)).toEqual(["second", "first"]);
    expect(result[0].weightChange).toBeCloseTo(-0.7);
    expect(result[0].bodyFatChange).toBeCloseTo(-0.5);
    expect(result[1].weightChange).toBeUndefined();
  });

  it("不会修改传入数组", () => {
    const source = [
      metric("new", "2026-08-10", 71.8, 15.9),
      metric("old", "2026-08-01", 72.5, 16.4),
    ];

    getBodyMetricHistory(source);

    expect(source.map((item) => item.id)).toEqual(["new", "old"]);
  });
});
