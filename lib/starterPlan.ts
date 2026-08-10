import type { TrainingPlan } from "./types";

export const starterPlan: TrainingPlan = {
  id: "starter-plan",
  name: "基础力量",
  active: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  days: [
    {
      id: "starter-monday",
      weekday: 1,
      name: "上肢力量",
      exercises: [
        { id: "starter-bench", name: "杠铃卧推", sets: 4, reps: 6, weight: 60 },
        { id: "starter-row", name: "杠铃划船", sets: 4, reps: 8, weight: 50 },
      ],
    },
    {
      id: "starter-thursday",
      weekday: 4,
      name: "下肢力量",
      exercises: [
        { id: "starter-squat", name: "深蹲", sets: 4, reps: 6, weight: 80 },
        { id: "starter-deadlift", name: "硬拉", sets: 3, reps: 5, weight: 90 },
      ],
    },
  ],
};
