import connectPgSimple from "connect-pg-simple";
import session from "express-session";
import { environment } from "../config/environment.js";

export const sessionCookieName = "grade_tracker.sid";

export function createSessionMiddleware() {
  const PgSessionStore = connectPgSimple(session);
  const isProduction = environment.nodeEnv === "production";
  const isTest = environment.nodeEnv === "test";

  return session({
    name: sessionCookieName,
    secret: environment.sessionSecret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store: isTest
      ? undefined
      : new PgSessionStore({
          conString: environment.databaseUrl,
          tableName: "sessions",
          createTableIfMissing: false,
        }),
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  });
}
