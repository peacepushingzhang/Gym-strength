import { z } from "zod";

const timestamped = {
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
};

export const workoutExerciseSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  sets: z.number().int().positive(),
  reps: z.number().int().positive(),
  weight: z.number().nonnegative(),
});

export const bodyMetricSchema = z.object({
  ...timestamped,
  date: z.string(),
  weight: z.number().positive(),
  bodyFat: z.number().min(0).max(100),
});

export const workoutRecordSchema = z.object({
  ...timestamped,
  date: z.string(),
  planName: z.string().min(1),
  exercises: z.array(workoutExerciseSchema).min(1),
  calories: z.number().nonnegative(),
  notes: z.string().optional(),
});

const planExerciseSchema = workoutExerciseSchema;

const trainingDaySchema = z.object({
  id: z.string(),
  weekday: z.number().int().min(0).max(6),
  name: z.string().min(1),
  exercises: z.array(planExerciseSchema),
});

export const trainingPlanSchema = z.object({
  ...timestamped,
  name: z.string().min(1),
  active: z.boolean(),
  days: z.array(trainingDaySchema),
});

export const exercisePRSchema = z.object({
  ...timestamped,
  exerciseName: z.string().min(1),
  muscleGroup: z.string().optional(),
  weight: z.number().positive(),
  date: z.string(),
  notes: z.string().optional(),
});

export const aiInsightSchema = z.object({
  ...timestamped,
  kind: z.enum(["workout", "pr"]),
  relatedId: z.string(),
  summary: z.string(),
  suggestion: z.string().optional(),
  source: z.enum(["ai", "local"]),
});

export const fitnessDataExportSchema = z.object({
  schemaVersion: z.literal(1),
  exportedAt: z.string(),
  bodyMetrics: z.array(bodyMetricSchema),
  trainingPlans: z.array(trainingPlanSchema),
  workoutRecords: z.array(workoutRecordSchema),
  exercisePRs: z.array(exercisePRSchema),
  aiInsights: z.array(aiInsightSchema),
});
