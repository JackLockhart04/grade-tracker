import { fileURLToPath } from "node:url";
import { config } from "dotenv";

config({ path: fileURLToPath(new URL("../../../.env", import.meta.url)) });

const localDatabaseUrl =
  "postgresql://postgres:postgres@localhost:5432/grade_tracker";

const databaseUrl =
  process.env.DATABASE_URL ??
  (process.env.NODE_ENV === "production" ? undefined : localDatabaseUrl);

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required in production.");
}

export const environment = {
  databaseUrl,
};
