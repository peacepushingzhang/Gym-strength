import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const createDatabase = () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL 未配置，无法启用云端数据模式");
  }

  const client = postgres(databaseUrl, {
    max: process.env.NODE_ENV === "production" ? 10 : 2,
    prepare: false,
  });

  return drizzle(client, { schema });
};

let database: ReturnType<typeof createDatabase> | undefined;

export const getDb = () => {
  database ??= createDatabase();
  return database;
};
