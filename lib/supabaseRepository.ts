import { createClient, type SupabaseClient } from "@supabase/supabase-js";
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

type TableName =
  | "body_metrics"
  | "training_plans"
  | "workout_records"
  | "exercise_prs"
  | "ai_insights";

type DatabaseRow = Record<string, unknown>;

const throwIfError = (error: { message: string } | null, action: string) => {
  if (error) throw new Error(`${action}失败：${error.message}`);
};

export const createSupabaseRepository = (): FitnessRepository => {
  let client: SupabaseClient | undefined;
  let identityPromise: Promise<{ client: SupabaseClient; userId: string }> | undefined;

  const getIdentity = () => {
    if (identityPromise) return identityPromise;

    identityPromise = (async () => {
      if (!supabaseUrl || !supabaseAnonKey) throw new Error("Supabase 环境变量未配置完整");
      client ??= createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      });

      const { data: sessionData, error: sessionError } = await client.auth.getSession();
      throwIfError(sessionError, "读取云端会话");
      if (sessionData.session?.user.id) return { client, userId: sessionData.session.user.id };

      const { data, error } = await client.auth.signInAnonymously();
      throwIfError(error, "创建匿名用户");
      if (!data.user?.id) throw new Error("创建匿名用户失败：未返回用户标识");
      return { client, userId: data.user.id };
    })().catch((error) => {
      identityPromise = undefined;
      throw error;
    });

    return identityPromise;
  };

  const listRows = async (table: TableName): Promise<DatabaseRow[]> => {
    const { client: activeClient, userId } = await getIdentity();
    const { data, error } = await activeClient.from(table).select("*").eq("user_id", userId);
    throwIfError(error, "读取云端数据");
    return (data ?? []) as DatabaseRow[];
  };

  const saveRow = async (table: TableName, row: DatabaseRow) => {
    const { client: activeClient, userId } = await getIdentity();
    const { error } = await activeClient
      .from(table)
      .upsert({ ...row, user_id: userId }, { onConflict: "user_id,id" });
    throwIfError(error, "保存云端数据");
  };

  const deleteRow = async (table: TableName, id: string) => {
    const { client: activeClient, userId } = await getIdentity();
    const { error } = await activeClient.from(table).delete().eq("user_id", userId).eq("id", id);
    throwIfError(error, "删除云端数据");
  };

  const clearTable = async (table: TableName) => {
    const { client: activeClient, userId } = await getIdentity();
    const { error } = await activeClient.from(table).delete().eq("user_id", userId);
    throwIfError(error, "清理云端数据");
  };

  const bodyMetricFromRow = (row: DatabaseRow): BodyMetric => bodyMetricSchema.parse({
    id: row.id,
    date: row.date,
    weight: Number(row.weight),
    bodyFat: Number(row.body_fat),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });

  const trainingPlanFromRow = (row: DatabaseRow): TrainingPlan => trainingPlanSchema.parse({
    id: row.id,
    name: row.name,
    active: row.active,
    days: row.days,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });

  const workoutFromRow = (row: DatabaseRow): WorkoutRecord => workoutRecordSchema.parse({
    id: row.id,
    date: row.date,
    planName: row.plan_name,
    exercises: row.exercises,
    calories: Number(row.calories),
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });

  const prFromRow = (row: DatabaseRow): ExercisePR => exercisePRSchema.parse({
    id: row.id,
    exerciseName: row.exercise_name,
    muscleGroup: row.muscle_group ?? undefined,
    weight: Number(row.weight),
    date: row.date,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });

  const insightFromRow = (row: DatabaseRow): AIInsight => aiInsightSchema.parse({
    id: row.id,
    kind: row.kind,
    relatedId: row.related_id,
    summary: row.summary,
    suggestion: row.suggestion ?? undefined,
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });

  const saveBodyMetric = (metric: BodyMetric) => saveRow("body_metrics", {
    id: metric.id,
    date: metric.date,
    weight: metric.weight,
    body_fat: metric.bodyFat,
    created_at: metric.createdAt,
    updated_at: metric.updatedAt,
  });

  const saveTrainingPlan = (plan: TrainingPlan) => saveRow("training_plans", {
    id: plan.id,
    name: plan.name,
    active: plan.active,
    days: plan.days,
    created_at: plan.createdAt,
    updated_at: plan.updatedAt,
  });

  const saveWorkoutRecord = (record: WorkoutRecord) => saveRow("workout_records", {
    id: record.id,
    date: record.date,
    plan_name: record.planName,
    exercises: record.exercises,
    calories: record.calories,
    notes: record.notes ?? null,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  });

  const saveExercisePR = (record: ExercisePR) => saveRow("exercise_prs", {
    id: record.id,
    exercise_name: record.exerciseName,
    muscle_group: record.muscleGroup ?? null,
    weight: record.weight,
    date: record.date,
    notes: record.notes ?? null,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  });

  const saveAIInsight = (insight: AIInsight) => saveRow("ai_insights", {
    id: insight.id,
    kind: insight.kind,
    related_id: insight.relatedId,
    summary: insight.summary,
    suggestion: insight.suggestion ?? null,
    source: insight.source,
    created_at: insight.createdAt,
    updated_at: insight.updatedAt,
  });

  const repository: FitnessRepository = {
    listBodyMetrics: async () => (await listRows("body_metrics")).map(bodyMetricFromRow),
    saveBodyMetric,
    listTrainingPlans: async () => (await listRows("training_plans")).map(trainingPlanFromRow),
    saveTrainingPlan,
    deleteTrainingPlan: (id) => deleteRow("training_plans", id),
    listWorkoutRecords: async () => (await listRows("workout_records")).map(workoutFromRow),
    saveWorkoutRecord,
    deleteWorkoutRecord: (id) => deleteRow("workout_records", id),
    listExercisePRs: async () => (await listRows("exercise_prs")).map(prFromRow),
    saveExercisePR,
    listAIInsights: async () => (await listRows("ai_insights")).map(insightFromRow),
    saveAIInsight,
    async exportData(): Promise<FitnessDataExport> {
      const [bodyMetrics, trainingPlans, workoutRecords, exercisePRs, aiInsights] = await Promise.all([
        repository.listBodyMetrics(),
        repository.listTrainingPlans(),
        repository.listWorkoutRecords(),
        repository.listExercisePRs(),
        repository.listAIInsights(),
      ]);
      return {
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        bodyMetrics,
        trainingPlans,
        workoutRecords,
        exercisePRs,
        aiInsights,
      };
    },
    async importData(data) {
      const parsed = fitnessDataExportSchema.parse(data);
      await Promise.all([
        clearTable("body_metrics"),
        clearTable("training_plans"),
        clearTable("workout_records"),
        clearTable("exercise_prs"),
        clearTable("ai_insights"),
      ]);
      await Promise.all([
        ...parsed.bodyMetrics.map(saveBodyMetric),
        ...parsed.trainingPlans.map(saveTrainingPlan),
        ...parsed.workoutRecords.map(saveWorkoutRecord),
        ...parsed.exercisePRs.map(saveExercisePR),
        ...parsed.aiInsights.map(saveAIInsight),
      ]);
    },
    async ensureStarterData() {
      const plans = await repository.listTrainingPlans();
      if (plans.length === 0) await saveTrainingPlan(starterPlan);
    },
  };

  return repository;
};
