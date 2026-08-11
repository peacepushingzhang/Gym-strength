import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { getDb } from "./db";
import { authSchema } from "./db/schema";

const createAuth = () =>
  betterAuth({
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema: authSchema,
    }),
    emailAndPassword: {
      enabled: true,
    },
  });

let authInstance: ReturnType<typeof createAuth> | undefined;

export const getAuth = () => {
  if (!process.env.BETTER_AUTH_SECRET) {
    throw new Error("BETTER_AUTH_SECRET 未配置，无法启用云端认证");
  }
  if (!process.env.BETTER_AUTH_URL) {
    throw new Error("BETTER_AUTH_URL 未配置，无法启用云端认证");
  }
  authInstance ??= createAuth();
  return authInstance;
};
