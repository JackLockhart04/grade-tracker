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

const defaultAuthRateLimitMax = 10;
const defaultAuthRateLimitWindowMs = 15 * 60 * 1000;

function parsePositiveInteger(name: string, fallback: number): number {
  const raw = process.env[name];

  if (raw === undefined || raw === "") {
    return fallback;
  }

  const value = Number(raw);

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return value;
}

const authRateLimitMax = parsePositiveInteger(
  "AUTH_RATE_LIMIT_MAX",
  defaultAuthRateLimitMax,
);
const authRateLimitWindowMs = parsePositiveInteger(
  "AUTH_RATE_LIMIT_WINDOW_MS",
  defaultAuthRateLimitWindowMs,
);

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
  authRateLimitMax,
  authRateLimitWindowMs,
};
