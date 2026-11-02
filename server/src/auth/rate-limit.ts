import { rateLimit } from "express-rate-limit";
import { environment } from "../config/environment.js";

export const tooManyAttemptsMessage = "Too many attempts. Try again later.";

/**
 * Limits how many times one client IP can call a credential endpoint inside
 * a fixed window. Each route that uses it gets its own counter, so the login
 * and registration budgets are tracked separately. Counts live in memory and
 * reset when the server restarts.
 */
export function createAuthRateLimiter() {
  return rateLimit({
    windowMs: environment.authRateLimitWindowMs,
    limit: environment.authRateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_request, response) => {
      response.status(429).json({ error: tooManyAttemptsMessage });
    },
  });
}
