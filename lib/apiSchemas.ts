import { z } from "zod";
import {
  aiInsightSchema,
  bodyMetricSchema,
  exercisePRSchema,
  fitnessDataExportSchema,
  trainingPlanSchema,
  workoutRecordSchema,
} from "./schemas";

export const fitnessResourceSchema = z.enum([
  "bodyMetrics",
  "trainingPlans",
  "workoutRecords",
  "exercisePRs",
  "aiInsights",
]);

export type FitnessResource = z.infer<typeof fitnessResourceSchema>;

export const saveFitnessRecordSchema = z.discriminatedUnion("resource", [
  z.object({ resource: z.literal("bodyMetrics"), record: bodyMetricSchema }),
  z.object({ resource: z.literal("trainingPlans"), record: trainingPlanSchema }),
  z.object({ resource: z.literal("workoutRecords"), record: workoutRecordSchema }),
  z.object({ resource: z.literal("exercisePRs"), record: exercisePRSchema }),
  z.object({ resource: z.literal("aiInsights"), record: aiInsightSchema }),
]);

export const deleteFitnessRecordSchema = z.object({
  resource: z.enum(["trainingPlans", "workoutRecords"]),
  id: z.string().min(1),
});

export const importFitnessDataSchema = fitnessDataExportSchema;

