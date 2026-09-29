import express from "express";
import { checkDatabase as defaultCheckDatabase } from "./database/readiness.js";

type AppDependencies = {
  checkDatabase?: () => Promise<void>;
};

export function createApp({
  checkDatabase = defaultCheckDatabase,
}: AppDependencies = {}) {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json());

  app.get("/api/health", (_request, response) => {
    response.status(200).json({ status: "ok" });
  });

  app.get("/api/ready", async (_request, response) => {
    try {
      await checkDatabase();
      response.status(200).json({ status: "ready" });
    } catch {
      response.status(503).json({ status: "unavailable" });
    }
  });

  app.get("/api", (_request, response) => {
    response.json({ name: "Grade Tracker API" });
  });

  return app;
}

export const app = createApp();
