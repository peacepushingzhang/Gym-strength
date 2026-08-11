import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const createDatabase = () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL 未配置，无法启用云端数据模式");
  }

  return drizzle(databaseUrl, { schema });
};

let database: ReturnType<typeof createDatabase> | undefined;

export const getDb = () => {
  database ??= createDatabase();
  return database;
};
