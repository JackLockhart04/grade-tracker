import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import { createAssignmentRouter } from "./assignments/router.js";
import { requireAuthentication } from "./auth/require-authentication.js";
import { createAuthRouter } from "./auth/router.js";
import { createSessionMiddleware } from "./auth/session.js";
import { environment } from "./config/environment.js";
import { createCourseRouter } from "./courses/router.js";
import { checkDatabase as defaultCheckDatabase } from "./database/readiness.js";

type AppDependencies = {
  checkDatabase?: () => Promise<void>;
};

export function isMalformedJsonError(error: unknown): boolean {
  return Boolean(
    error instanceof SyntaxError &&
      "status" in error &&
      error.status === 400 &&
      "type" in error &&
      error.type === "entity.parse.failed",
  );
}

export function handleApplicationError(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
) {
  if (isMalformedJsonError(error)) {
    response.status(400).json({ error: "Invalid JSON body." });
    return;
  }

  console.error(error);
  response.status(500).json({ error: "An unexpected error occurred." });
}

export function createApp({
  checkDatabase = defaultCheckDatabase,
}: AppDependencies = {}) {
  const app = express();

  app.use(helmet());
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
  app.use("/api", requireAuthentication, createCourseRouter());
  app.use("/api", requireAuthentication, createAssignmentRouter());

  app.use(handleApplicationError);

  return app;
}

export const app = createApp();
