import { argon2id, hash, verify } from "argon2";
import { Router, type Request } from "express";
import { prisma } from "../database/prisma.js";
import { sessionCookieName } from "./session.js";

const minimumPasswordLength = 12;
const maximumPasswordLength = 128;

type Credentials = {
  email: string;
  password: string;
};

function parseCredentials(body: unknown): Credentials | undefined {
  if (!body || typeof body !== "object") {
    return undefined;
  }

  const { email, password } = body as Record<string, unknown>;

  if (typeof email !== "string" || typeof password !== "string") {
    return undefined;
  }

  return {
    email: email.trim().toLowerCase(),
    password,
  };
}

function isValidEmail(email: string): boolean {
  return (
    email.length <= 320 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );
}

function serializeUser(user: {
  id: string;
  email: string;
  createdAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
  };
}

function regenerateSession(request: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    request.session.regenerate((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function saveSession(request: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    request.session.save((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

export function createAuthRouter() {
  const router = Router();

  router.post("/register", async (request, response, next) => {
    try {
      const credentials = parseCredentials(request.body);

      if (!credentials || !isValidEmail(credentials.email)) {
        response.status(400).json({ error: "Enter a valid email address." });
        return;
      }

      if (
        credentials.password.length < minimumPasswordLength ||
        credentials.password.length > maximumPasswordLength
      ) {
        response.status(400).json({
          error: `Password must be between ${minimumPasswordLength} and ${maximumPasswordLength} characters.`,
        });
        return;
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: credentials.email },
        select: { id: true },
      });

      if (existingUser) {
        response.status(409).json({ error: "An account with that email already exists." });
        return;
      }

      const passwordHash = await hash(credentials.password, {
        type: argon2id,
      });

      const user = await prisma.user.create({
        data: {
          email: credentials.email,
          passwordHash,
        },
        select: {
          id: true,
          email: true,
          createdAt: true,
        },
      });

      await regenerateSession(request);
      request.session.userId = user.id;
      await saveSession(request);

      response.status(201).json({ user: serializeUser(user) });
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "P2002"
      ) {
        response.status(409).json({ error: "An account with that email already exists." });
        return;
      }

      next(error);
    }
  });

  router.post("/login", async (request, response, next) => {
    try {
      const credentials = parseCredentials(request.body);
      const invalidCredentials = { error: "Invalid email or password." };

      if (!credentials) {
        response.status(401).json(invalidCredentials);
        return;
      }

      const user = await prisma.user.findUnique({
        where: { email: credentials.email },
      });

      if (!user || !(await verify(user.passwordHash, credentials.password))) {
        response.status(401).json(invalidCredentials);
        return;
      }

      await regenerateSession(request);
      request.session.userId = user.id;
      await saveSession(request);

      response.status(200).json({ user: serializeUser(user) });
    } catch (error) {
      next(error);
    }
  });

  router.post("/logout", async (request, response, next) => {
    try {
      await new Promise<void>((resolve, reject) => {
        request.session.destroy((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });

      response.clearCookie(sessionCookieName);
      response.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  router.get("/me", async (request, response, next) => {
    try {
      if (!request.session.userId) {
        response.status(401).json({ error: "Authentication required." });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: request.session.userId },
        select: {
          id: true,
          email: true,
          createdAt: true,
        },
      });

      if (!user) {
        request.session.destroy(() => undefined);
        response.status(401).json({ error: "Authentication required." });
        return;
      }

      response.status(200).json({ user: serializeUser(user) });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
