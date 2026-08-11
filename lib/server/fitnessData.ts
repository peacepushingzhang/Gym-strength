import { and, eq } from "drizzle-orm";
import { getDb } from "../db";
import {
  aiInsights,
  bodyMetrics,
  exercisePRs,
  trainingPlans,
  workoutRecords,
} from "../db/schema";
import type { FitnessResource } from "../apiSchemas";
import type {
  AIInsight,
  BodyMetric,
  ExercisePR,
  FitnessDataExport,
  TrainingPlan,
  WorkoutRecord,
} from "../types";

const toIsoString = (value: Date) => value.toISOString();
const toDate = (value: string) => new Date(value);

const bodyMetricFromRow = (row: typeof bodyMetrics.$inferSelect): BodyMetric => ({
  id: row.id,
  date: row.date,
  weight: row.weight,
  bodyFat: row.bodyFat,
  createdAt: toIsoString(row.createdAt),
  updatedAt: toIsoString(row.updatedAt),
});

const trainingPlanFromRow = (row: typeof trainingPlans.$inferSelect): TrainingPlan => ({
  id: row.id,
  name: row.name,
  active: row.active,
  days: row.days,
  createdAt: toIsoString(row.createdAt),
  updatedAt: toIsoString(row.updatedAt),
});

const workoutRecordFromRow = (row: typeof workoutRecords.$inferSelect): WorkoutRecord => ({
  id: row.id,
  date: row.date,
  planName: row.planName,
  exercises: row.exercises,
  calories: row.calories,
  notes: row.notes ?? undefined,
  createdAt: toIsoString(row.createdAt),
  updatedAt: toIsoString(row.updatedAt),
});

const exercisePRFromRow = (row: typeof exercisePRs.$inferSelect): ExercisePR => ({
  id: row.id,
  exerciseName: row.exerciseName,
  muscleGroup: row.muscleGroup ?? undefined,
  weight: row.weight,
  date: row.date,
  notes: row.notes ?? undefined,
  createdAt: toIsoString(row.createdAt),
  updatedAt: toIsoString(row.updatedAt),
});

const insightFromRow = (row: typeof aiInsights.$inferSelect): AIInsight => ({
  id: row.id,
  kind: row.kind,
  relatedId: row.relatedId,
  summary: row.summary,
  suggestion: row.suggestion ?? undefined,
  source: row.source,
  createdAt: toIsoString(row.createdAt),
  updatedAt: toIsoString(row.updatedAt),
});

export async function listFitnessResource(userId: string, resource: FitnessResource) {
  const db = getDb();
  switch (resource) {
    case "bodyMetrics":
      return (await db.select().from(bodyMetrics).where(eq(bodyMetrics.userId, userId))).map(bodyMetricFromRow);
    case "trainingPlans":
      return (await db.select().from(trainingPlans).where(eq(trainingPlans.userId, userId))).map(trainingPlanFromRow);
    case "workoutRecords":
      return (await db.select().from(workoutRecords).where(eq(workoutRecords.userId, userId))).map(workoutRecordFromRow);
    case "exercisePRs":
      return (await db.select().from(exercisePRs).where(eq(exercisePRs.userId, userId))).map(exercisePRFromRow);
    case "aiInsights":
      return (await db.select().from(aiInsights).where(eq(aiInsights.userId, userId))).map(insightFromRow);
  }
}

export async function saveFitnessRecord(
  userId: string,
  input:
    | { resource: "bodyMetrics"; record: BodyMetric }
    | { resource: "trainingPlans"; record: TrainingPlan }
    | { resource: "workoutRecords"; record: WorkoutRecord }
    | { resource: "exercisePRs"; record: ExercisePR }
    | { resource: "aiInsights"; record: AIInsight },
) {
  const db = getDb();
  const createdAt = toDate(input.record.createdAt);
  const updatedAt = toDate(input.record.updatedAt);

  switch (input.resource) {
    case "bodyMetrics": {
      const values = { userId, ...input.record, createdAt, updatedAt };
      await db.insert(bodyMetrics).values(values).onConflictDoUpdate({
        target: [bodyMetrics.userId, bodyMetrics.id],
        set: { date: values.date, weight: values.weight, bodyFat: values.bodyFat, updatedAt },
      });
      return;
    }
    case "trainingPlans": {
      const values = { userId, ...input.record, createdAt, updatedAt };
      await db.insert(trainingPlans).values(values).onConflictDoUpdate({
        target: [trainingPlans.userId, trainingPlans.id],
        set: { name: values.name, active: values.active, days: values.days, updatedAt },
      });
      return;
    }
    case "workoutRecords": {
      const values = { userId, ...input.record, createdAt, updatedAt };
      await db.insert(workoutRecords).values(values).onConflictDoUpdate({
        target: [workoutRecords.userId, workoutRecords.id],
        set: {
          date: values.date,
          planName: values.planName,
          exercises: values.exercises,
          calories: values.calories,
          notes: values.notes ?? null,
          updatedAt,
        },
      });
      return;
    }
    case "exercisePRs": {
      const values = { userId, ...input.record, createdAt, updatedAt };
      await db.insert(exercisePRs).values(values).onConflictDoUpdate({
        target: [exercisePRs.userId, exercisePRs.id],
        set: {
          exerciseName: values.exerciseName,
          muscleGroup: values.muscleGroup ?? null,
          weight: values.weight,
          date: values.date,
          notes: values.notes ?? null,
          updatedAt,
        },
      });
      return;
    }
    case "aiInsights": {
      const values = { userId, ...input.record, createdAt, updatedAt };
      await db.insert(aiInsights).values(values).onConflictDoUpdate({
        target: [aiInsights.userId, aiInsights.id],
        set: {
          kind: values.kind,
          relatedId: values.relatedId,
          summary: values.summary,
          suggestion: values.suggestion ?? null,
          source: values.source,
          updatedAt,
        },
      });
    }
  }
}

export async function deleteFitnessRecord(
  userId: string,
  resource: "trainingPlans" | "workoutRecords",
  id: string,
) {
  const table = resource === "trainingPlans" ? trainingPlans : workoutRecords;
  await getDb().delete(table).where(and(eq(table.userId, userId), eq(table.id, id)));
}

export async function exportFitnessData(userId: string): Promise<FitnessDataExport> {
  const [bodyMetricRows, planRows, workoutRows, prRows, insightRows] = await Promise.all([
    listFitnessResource(userId, "bodyMetrics") as Promise<BodyMetric[]>,
    listFitnessResource(userId, "trainingPlans") as Promise<TrainingPlan[]>,
    listFitnessResource(userId, "workoutRecords") as Promise<WorkoutRecord[]>,
    listFitnessResource(userId, "exercisePRs") as Promise<ExercisePR[]>,
    listFitnessResource(userId, "aiInsights") as Promise<AIInsight[]>,
  ]);

  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    bodyMetrics: bodyMetricRows,
    trainingPlans: planRows,
    workoutRecords: workoutRows,
    exercisePRs: prRows,
    aiInsights: insightRows,
  };
}

export async function replaceFitnessData(userId: string, data: FitnessDataExport) {
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx.delete(bodyMetrics).where(eq(bodyMetrics.userId, userId));
    await tx.delete(trainingPlans).where(eq(trainingPlans.userId, userId));
    await tx.delete(workoutRecords).where(eq(workoutRecords.userId, userId));
    await tx.delete(exercisePRs).where(eq(exercisePRs.userId, userId));
    await tx.delete(aiInsights).where(eq(aiInsights.userId, userId));

    if (data.bodyMetrics.length) {
      await tx.insert(bodyMetrics).values(data.bodyMetrics.map((record) => ({
        userId,
        ...record,
        createdAt: toDate(record.createdAt),
        updatedAt: toDate(record.updatedAt),
      })));
    }
    if (data.trainingPlans.length) {
      await tx.insert(trainingPlans).values(data.trainingPlans.map((record) => ({
        userId,
        ...record,
        createdAt: toDate(record.createdAt),
        updatedAt: toDate(record.updatedAt),
      })));
    }
    if (data.workoutRecords.length) {
      await tx.insert(workoutRecords).values(data.workoutRecords.map((record) => ({
        userId,
        ...record,
        createdAt: toDate(record.createdAt),
        updatedAt: toDate(record.updatedAt),
      })));
    }
    if (data.exercisePRs.length) {
      await tx.insert(exercisePRs).values(data.exercisePRs.map((record) => ({
        userId,
        ...record,
        createdAt: toDate(record.createdAt),
        updatedAt: toDate(record.updatedAt),
      })));
    }
    if (data.aiInsights.length) {
      await tx.insert(aiInsights).values(data.aiInsights.map((record) => ({
        userId,
        ...record,
        createdAt: toDate(record.createdAt),
        updatedAt: toDate(record.updatedAt),
      })));
    }
  });
}

