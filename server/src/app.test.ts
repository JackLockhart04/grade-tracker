import type { Server } from "node:http";
import type { Express } from "express";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";

async function request(app: Express, path: string) {
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
    return await fetch(`http://127.0.0.1:${address.port}${path}`);
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
