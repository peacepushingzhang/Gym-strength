export type TabId = "home" | "pr" | "plan";

export interface TimestampedRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface BodyMetric extends TimestampedRecord {
  date: string;
  weight: number;
  bodyFat: number;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
}

export interface WorkoutRecord extends TimestampedRecord {
  date: string;
  planName: string;
  exercises: WorkoutExercise[];
  calories: number;
  notes?: string;
}

export interface PlanExercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
}

export interface TrainingDay {
  id: string;
  weekday: number;
  name: string;
  exercises: PlanExercise[];
}

export interface TrainingPlan extends TimestampedRecord {
  name: string;
  active: boolean;
  days: TrainingDay[];
}

export interface ExercisePR extends TimestampedRecord {
  exerciseName: string;
  muscleGroup?: string;
  weight: number;
  date: string;
  notes?: string;
}

export interface AIInsight extends TimestampedRecord {
  kind: "workout" | "pr";
  relatedId: string;
  summary: string;
  suggestion?: string;
  source: "ai" | "local";
}

export interface FitnessDataExport {
  schemaVersion: 1;
  exportedAt: string;
  bodyMetrics: BodyMetric[];
  trainingPlans: TrainingPlan[];
  workoutRecords: WorkoutRecord[];
  exercisePRs: ExercisePR[];
  aiInsights: AIInsight[];
}

export interface WorkoutDraft {
  date: string;
  planName: string;
  exercises: WorkoutExercise[];
  calories: number;
  notes?: string;
}

export const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
