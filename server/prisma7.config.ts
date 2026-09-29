import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

const localDatabaseUrl =
  "postgresql://postgres:postgres@localhost:5432/grade_tracker";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? localDatabaseUrl,
  },
});
