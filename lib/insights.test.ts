import { describe, expect, it } from "vitest";
import { createPRFallbackInsight, createWorkoutFallbackInsight } from "./insights";
import type { ExercisePR, WorkoutRecord } from "./types";

const stamp = "2026-08-09T10:00:00.000Z";

describe("local insight fallbacks", () => {
  it("summarizes workout volume", () => {
    const workout: WorkoutRecord = {
      id: "workout-1",
      date: "2026-08-09",
      planName: "上肢力量",
      calories: 320,
      createdAt: stamp,
      updatedAt: stamp,
      exercises: [{ id: "bench", name: "卧推", sets: 4, reps: 6, weight: 60 }],
    };
    const insight = createWorkoutFallbackInsight(workout);
    expect(insight.summary).toContain("1,440 kg");
    expect(insight.suggestion.length).toBeGreaterThan(8);
  });

  it("compares a new PR with prior history", () => {
    const previous: ExercisePR = {
      id: "old",
      exerciseName: "深蹲",
      weight: 100,
      date: "2026-07-01",
      createdAt: stamp,
      updatedAt: stamp,
    };
    const current: ExercisePR = { ...previous, id: "new", weight: 105, date: "2026-08-09" };
    expect(createPRFallbackInsight(current, [previous]).summary).toContain("5.0 kg");
  });
});
