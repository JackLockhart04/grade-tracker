import type { Server } from "node:http";
import type { Express, NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { createApp, handleApplicationError, isMalformedJsonError } from "./app.js";

async function request(app: Express, path: string, init?: RequestInit) {
  let server: Server | undefined;

  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      resolve();
    });
  });

  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Test server did not bind to a TCP port.");
  }

  try {
    return await fetch(`http://127.0.0.1:${address.port}${path}`, init);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server?.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
}

describe("GET /api/health", () => {
  it("reports that the API is healthy", async () => {
    const response = await request(createApp(), "/api/health");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });

  it("sends the helmet security headers on every response", async () => {
    const response = await request(createApp(), "/api/health");

    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("x-frame-options")).toBe("SAMEORIGIN");
    expect(response.headers.get("content-security-policy")).toContain("default-src 'self'");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("x-powered-by")).toBeNull();
  });
});

describe("GET /api/ready", () => {
  it("reports readiness when PostgreSQL is available", async () => {
    const response = await request(
      createApp({ checkDatabase: async () => undefined }),
      "/api/ready",
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ready" });
  });

  it("reports unavailability when PostgreSQL cannot be reached", async () => {
    const response = await request(
      createApp({
        checkDatabase: async () => {
          throw new Error("PostgreSQL unavailable");
        },
      }),
      "/api/ready",
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: "unavailable" });
  });
});

describe("JSON request parsing", () => {
  it("returns a generic 400 response for malformed JSON", async () => {
    const response = await request(createApp(), "/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: '{"name":',
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid JSON body." });
  });

  it("does not classify unrelated syntax errors as malformed request JSON", () => {
    const error = new SyntaxError("Unexpected internal syntax error");
    expect(isMalformedJsonError(error)).toBe(false);

    const json = vi.fn();
    const status = vi.fn();
    const response = { status, json } as unknown as Response;
    status.mockReturnValue(response);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    handleApplicationError(
      error,
      {} as Request,
      response,
      vi.fn() as NextFunction,
    );

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ error: "An unexpected error occurred." });
    consoleError.mockRestore();
  });
});
