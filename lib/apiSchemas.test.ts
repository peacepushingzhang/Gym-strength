import { describe, expect, it } from "vitest";
import { deleteFitnessRecordSchema, saveFitnessRecordSchema } from "./apiSchemas";

const now = "2026-08-11T00:00:00.000Z";

describe("fitness API schemas", () => {
  it("accepts a valid record and never keeps a client supplied user id", () => {
    const parsed = saveFitnessRecordSchema.parse({
      resource: "bodyMetrics",
      userId: "forged-user",
      record: {
        id: "metric-1",
        date: "2026-08-11",
        weight: 72.4,
        bodyFat: 15.8,
        createdAt: now,
        updatedAt: now,
        userId: "forged-user",
      },
    });

    expect("userId" in parsed).toBe(false);
    expect("userId" in parsed.record).toBe(false);
  });

  it("only allows deleting plans and workout records", () => {
    expect(deleteFitnessRecordSchema.safeParse({ resource: "workoutRecords", id: "workout-1" }).success).toBe(true);
    expect(deleteFitnessRecordSchema.safeParse({ resource: "bodyMetrics", id: "metric-1" }).success).toBe(false);
  });
});
