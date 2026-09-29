import express, { type NextFunction, type Request, type Response } from "express";
import { createAuthRouter } from "./auth/router.js";
import { createSessionMiddleware } from "./auth/session.js";
import { environment } from "./config/environment.js";
import { checkDatabase as defaultCheckDatabase } from "./database/readiness.js";

type AppDependencies = {
  checkDatabase?: () => Promise<void>;
};

export function createApp({
  checkDatabase = defaultCheckDatabase,
}: AppDependencies = {}) {
  const app = express();

  app.disable("x-powered-by");
  if (environment.nodeEnv === "production") {
    app.set("trust proxy", 1);
  }
  app.use(express.json());
  app.use(createSessionMiddleware());

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

  app.use("/api/auth", createAuthRouter());

  app.use(
    (error: unknown, _request: Request, response: Response, _next: NextFunction) => {
      console.error(error);
      response.status(500).json({ error: "An unexpected error occurred." });
    },
  );

  return app;
}

export const app = createApp();
