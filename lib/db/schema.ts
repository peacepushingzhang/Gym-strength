import {
  boolean,
  doublePrecision,
  index,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { TrainingDay, WorkoutExercise } from "../types";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
};

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull(),
    image: text("image"),
    ...timestamps,
  },
  (table) => [uniqueIndex("user_email_unique").on(table.email)],
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("session_token_unique").on(table.token),
    index("session_user_id_idx").on(table.userId),
  ],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    ...timestamps,
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const bodyMetrics = pgTable(
  "body_metrics",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    id: text("id").notNull(),
    date: text("date").notNull(),
    weight: doublePrecision("weight").notNull(),
    bodyFat: doublePrecision("body_fat").notNull(),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.id] }),
    index("body_metrics_user_date_idx").on(table.userId, table.date),
  ],
);

export const trainingPlans = pgTable(
  "training_plans",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    id: text("id").notNull(),
    name: text("name").notNull(),
    active: boolean("active").notNull(),
    days: jsonb("days").$type<TrainingDay[]>().notNull(),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.id] }),
    index("training_plans_user_idx").on(table.userId),
  ],
);

export const workoutRecords = pgTable(
  "workout_records",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    id: text("id").notNull(),
    date: text("date").notNull(),
    planName: text("plan_name").notNull(),
    exercises: jsonb("exercises").$type<WorkoutExercise[]>().notNull(),
    calories: doublePrecision("calories").notNull(),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.id] }),
    index("workout_records_user_date_idx").on(table.userId, table.date),
  ],
);

export const exercisePRs = pgTable(
  "exercise_prs",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    id: text("id").notNull(),
    exerciseName: text("exercise_name").notNull(),
    muscleGroup: text("muscle_group"),
    weight: doublePrecision("weight").notNull(),
    date: text("date").notNull(),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.id] }),
    index("exercise_prs_user_exercise_idx").on(table.userId, table.exerciseName),
  ],
);

export const aiInsights = pgTable(
  "ai_insights",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    id: text("id").notNull(),
    kind: text("kind").$type<"workout" | "pr">().notNull(),
    relatedId: text("related_id").notNull(),
    summary: text("summary").notNull(),
    suggestion: text("suggestion"),
    source: text("source").$type<"ai" | "local">().notNull(),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.id] }),
    index("ai_insights_user_related_idx").on(table.userId, table.relatedId),
  ],
);

export const authSchema = { user, session, account, verification };

