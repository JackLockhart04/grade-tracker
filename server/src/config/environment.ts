import { fileURLToPath } from "node:url";
import { config } from "dotenv";

config({ path: fileURLToPath(new URL("../../../.env", import.meta.url)) });

const localDatabaseUrl =
  "postgresql://postgres:postgres@localhost:5432/grade_tracker";

const databaseUrl =
  process.env.DATABASE_URL ??
  (process.env.NODE_ENV === "production" ? undefined : localDatabaseUrl);

const nodeEnv = process.env.NODE_ENV ?? "development";
const sessionSecret =
  process.env.SESSION_SECRET ??
  (nodeEnv === "production"
    ? undefined
    : "grade-tracker-local-session-secret-change-for-production");

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required in production.");
}

if (!sessionSecret) {
  throw new Error("SESSION_SECRET is required in production.");
}

export const environment = {
  databaseUrl,
  nodeEnv,
  sessionSecret,
};
