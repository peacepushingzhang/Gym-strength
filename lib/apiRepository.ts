import {
  aiInsightSchema,
  bodyMetricSchema,
  exercisePRSchema,
  fitnessDataExportSchema,
  trainingPlanSchema,
  workoutRecordSchema,
} from "./schemas";
import { starterPlan } from "./starterPlan";
import type { FitnessRepository } from "./repository";
import type {
  AIInsight,
  BodyMetric,
  ExercisePR,
  FitnessDataExport,
  TrainingPlan,
  WorkoutRecord,
} from "./types";

type Resource =
  | "bodyMetrics"
  | "trainingPlans"
  | "workoutRecords"
  | "exercisePRs"
  | "aiInsights";

const request = async (url: string, init?: RequestInit) => {
  const response = await fetch(url, {
    credentials: "include",
    ...init,
    headers: init?.body
      ? { "Content-Type": "application/json", ...init.headers }
      : init?.headers,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(payload?.error ?? `云端请求失败（${response.status}）`);
  }

  return response.json();
};

const list = async <T,>(resource: Resource, parse: (value: unknown) => T[]) =>
  parse(await request(`/api/fitness?resource=${resource}`));

const save = (resource: Resource, record: unknown) =>
  request("/api/fitness", {
    method: "POST",
    body: JSON.stringify({ resource, record }),
  }).then(() => undefined);

const remove = (resource: "trainingPlans" | "workoutRecords", id: string) =>
  request(`/api/fitness?resource=${resource}&id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  }).then(() => undefined);

export const createApiRepository = (): FitnessRepository => {
  const repository: FitnessRepository = {
    listBodyMetrics: () => list("bodyMetrics", (value) => bodyMetricSchema.array().parse(value)),
    saveBodyMetric: (record: BodyMetric) => save("bodyMetrics", record),
    listTrainingPlans: () => list("trainingPlans", (value) => trainingPlanSchema.array().parse(value)),
    saveTrainingPlan: (record: TrainingPlan) => save("trainingPlans", record),
    deleteTrainingPlan: (id) => remove("trainingPlans", id),
    listWorkoutRecords: () => list("workoutRecords", (value) => workoutRecordSchema.array().parse(value)),
    saveWorkoutRecord: (record: WorkoutRecord) => save("workoutRecords", record),
    deleteWorkoutRecord: (id) => remove("workoutRecords", id),
    listExercisePRs: () => list("exercisePRs", (value) => exercisePRSchema.array().parse(value)),
    saveExercisePR: (record: ExercisePR) => save("exercisePRs", record),
    listAIInsights: () => list("aiInsights", (value) => aiInsightSchema.array().parse(value)),
    saveAIInsight: (record: AIInsight) => save("aiInsights", record),
    async exportData(): Promise<FitnessDataExport> {
      return fitnessDataExportSchema.parse(await request("/api/fitness"));
    },
    async importData(data) {
      const parsed = fitnessDataExportSchema.parse(data);
      await request("/api/fitness", {
        method: "PUT",
        body: JSON.stringify(parsed),
      });
    },
    async ensureStarterData() {
      const plans = await repository.listTrainingPlans();
      if (plans.length === 0) await repository.saveTrainingPlan(starterPlan);
    },
  };

  return repository;
};

