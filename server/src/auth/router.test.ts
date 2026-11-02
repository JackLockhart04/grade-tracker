import type { Server } from "node:http";
import type { Express } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../database/prisma.js", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { createApp } from "../app.js";
import { prisma } from "../database/prisma.js";
import { tooManyAttemptsMessage } from "./rate-limit.js";

const userMethods = prisma.user as unknown as Record<string, ReturnType<typeof vi.fn>>;
const attemptLimit = 10;

async function withServer<T>(app: Express, run: (baseUrl: string) => Promise<T>) {
  let server: Server | undefined;
  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Test server did not bind to a TCP port.");
  }

  try {
    return await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server?.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function post(baseUrl: string, path: string, body: unknown) {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("authentication rate limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects the eleventh login attempt from one client within the window", async () => {
    userMethods.findUnique.mockResolvedValue(null);

    await withServer(createApp(), async (baseUrl) => {
      const credentials = { email: "student@example.com", password: "wrong-password-123" };

      for (let attempt = 1; attempt <= attemptLimit; attempt += 1) {
        const response = await post(baseUrl, "/api/auth/login", credentials);

        expect(response.status).toBe(401);
        expect(await response.json()).toEqual({ error: "Invalid email or password." });
        expect(response.headers.get("ratelimit-limit")).toBe(String(attemptLimit));
        expect(response.headers.get("ratelimit-remaining")).toBe(String(attemptLimit - attempt));
      }

      const blocked = await post(baseUrl, "/api/auth/login", credentials);

      expect(blocked.status).toBe(429);
      expect(await blocked.json()).toEqual({ error: tooManyAttemptsMessage });
      expect(blocked.headers.get("ratelimit-remaining")).toBe("0");
      expect(blocked.headers.get("retry-after")).toBeTruthy();
      expect(blocked.headers.get("x-ratelimit-limit")).toBeNull();
    });

    expect(userMethods.findUnique).toHaveBeenCalledTimes(attemptLimit);
  });

  it("limits registration attempts separately from login attempts", async () => {
    userMethods.findUnique.mockResolvedValue({ id: "existing-user" });

    await withServer(createApp(), async (baseUrl) => {
      const credentials = { email: "taken@example.com", password: "a-valid-length-password" };

      for (let attempt = 1; attempt <= attemptLimit; attempt += 1) {
        const response = await post(baseUrl, "/api/auth/register", credentials);

        expect(response.status).toBe(409);
        expect(response.headers.get("ratelimit-remaining")).toBe(String(attemptLimit - attempt));
      }

      const blocked = await post(baseUrl, "/api/auth/register", credentials);

      expect(blocked.status).toBe(429);
      expect(await blocked.json()).toEqual({ error: tooManyAttemptsMessage });

      const login = await post(baseUrl, "/api/auth/login", {
        email: "taken@example.com",
        password: "wrong-password-123",
      });

      expect(login.status).not.toBe(429);
      expect(login.headers.get("ratelimit-remaining")).toBe(String(attemptLimit - 1));
    });

    expect(userMethods.create).not.toHaveBeenCalled();
  });

  it("does not rate limit logout or the current-user lookup", async () => {
    await withServer(createApp(), async (baseUrl) => {
      const me = await fetch(`${baseUrl}/api/auth/me`);

      expect(me.status).toBe(401);
      expect(me.headers.get("ratelimit-limit")).toBeNull();

      const logout = await fetch(`${baseUrl}/api/auth/logout`, { method: "POST" });

      expect(logout.status).toBe(204);
      expect(logout.headers.get("ratelimit-limit")).toBeNull();
    });
  });
});
