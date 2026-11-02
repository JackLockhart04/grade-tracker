import type { Server } from "node:http";
import express, { type Express } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../database/prisma.js", () => ({
  prisma: {
    course: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    category: {
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    assignment: {
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { createApp } from "../app.js";
import { prisma } from "../database/prisma.js";
import { createCourseRouter } from "./router.js";

const courseId = "8cff8f02-9455-47f7-8e56-683d43481ee1";
const categoryId = "935457a4-99ba-441c-b48f-d4d15159927e";
const otherCategoryId = "a7b0a101-6767-4ff8-9548-461803f74052";
const now = new Date("2026-11-01T12:00:00.000Z");
const courseMethods = prisma.course as unknown as Record<string, ReturnType<typeof vi.fn>>;
const categoryMethods = prisma.category as unknown as Record<string, ReturnType<typeof vi.fn>>;
const assignmentMethods = prisma.assignment as unknown as Record<string, ReturnType<typeof vi.fn>>;

function decimal(value: number) {
  return { toString: () => String(value) };
}

function courseData() {
  return [
    {
      id: courseId,
      name: "Software Engineering",
      term: "Fall 2026",
      creditHours: decimal(3),
      createdAt: now,
      updatedAt: now,
      categories: [
        {
          id: categoryId,
          courseId,
          name: "Homework",
          weightPercentage: decimal(30),
          createdAt: now,
          updatedAt: now,
          assignments: [
            {
              id: "64857026-4db6-4db7-b0eb-5374cfaf96a2",
              categoryId,
              name: "Homework 1",
              earnedPoints: decimal(8),
              possiblePoints: decimal(10),
              createdAt: now,
              updatedAt: now,
            },
          ],
        },
        {
          id: otherCategoryId,
          courseId,
          name: "Exams",
          weightPercentage: decimal(50),
          createdAt: now,
          updatedAt: now,
          assignments: [
            {
              id: "f4585506-5b48-4f65-bffc-4a720c9bc8c8",
              categoryId: otherCategoryId,
              name: "Exam 1",
              earnedPoints: decimal(90),
              possiblePoints: decimal(100),
              createdAt: now,
              updatedAt: now,
            },
          ],
        },
      ],
    },
    {
      id: "d66d32d1-f7ca-437d-87da-e913329e03bf",
      name: "Databases",
      term: "Fall 2026",
      creditHours: decimal(1),
      createdAt: now,
      updatedAt: now,
      categories: [
        {
          id: "804cb7ea-6a4e-4ea3-b718-2b2162cd2a53",
          courseId: "d66d32d1-f7ca-437d-87da-e913329e03bf",
          name: "Labs",
          weightPercentage: decimal(100),
          createdAt: now,
          updatedAt: now,
          assignments: [
            {
              id: "47009a23-5189-4bda-9704-7ad29467614e",
              categoryId: "804cb7ea-6a4e-4ea3-b718-2b2162cd2a53",
              name: "Lab 1",
              earnedPoints: decimal(80),
              possiblePoints: decimal(100),
              createdAt: now,
              updatedAt: now,
            },
          ],
        },
      ],
    },
  ];
}

function authenticatedApp() {
  const app = express();
  app.use(express.json());
  app.use((_request, response, next) => {
    response.locals.userId = "signed-in-user";
    next();
  });
  app.use("/api", createCourseRouter());
  return app;
}

async function request(app: Express, path: string, body: unknown) {
  let server: Server | undefined;
  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Test server did not bind to a TCP port.");
  }

  try {
    return await fetch(`http://127.0.0.1:${address.port}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } finally {
    await new Promise<void>((resolve, reject) => {
      server?.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

describe("POST /api/courses/:courseId/what-if", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires an authenticated session", async () => {
    const response = await request(createApp(), `/api/courses/${courseId}/what-if`, {
      categoryId,
      earnedPoints: 92,
      possiblePoints: 100,
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Authentication required." });
  });

  it("returns generic not-found behavior for invalid IDs", async () => {
    const response = await request(authenticatedApp(), "/api/courses/not-a-uuid/what-if", {
      categoryId,
      earnedPoints: 92,
      possiblePoints: 100,
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Course or category not found." });
    expect(courseMethods.findMany).not.toHaveBeenCalled();
  });

  it.each([
    { earnedPoints: -1, possiblePoints: 100 },
    { earnedPoints: 92, possiblePoints: 0 },
    { earnedPoints: 1.001, possiblePoints: 100 },
    { earnedPoints: 92, possiblePoints: 100.001 },
    { earnedPoints: 100_000_000, possiblePoints: 100 },
    { earnedPoints: "92", possiblePoints: 100 },
  ])("rejects invalid point input: %o", async ({ earnedPoints, possiblePoints }) => {
    const response = await request(authenticatedApp(), `/api/courses/${courseId}/what-if`, {
      categoryId,
      earnedPoints,
      possiblePoints,
    });

    expect(response.status).toBe(400);
    expect(courseMethods.findMany).not.toHaveBeenCalled();
  });

  it("does not reveal an unowned or missing course", async () => {
    courseMethods.findMany.mockResolvedValue([]);

    const response = await request(authenticatedApp(), `/api/courses/${courseId}/what-if`, {
      categoryId,
      earnedPoints: 92,
      possiblePoints: 100,
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Course or category not found." });
  });

  it("does not reveal a category outside the owned course", async () => {
    courseMethods.findMany.mockResolvedValue(courseData());

    const response = await request(authenticatedApp(), `/api/courses/${courseId}/what-if`, {
      categoryId: "5f5fb0a6-4f73-46da-864b-0c5982fa962e",
      earnedPoints: 92,
      possiblePoints: 100,
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Course or category not found." });
  });

  it("returns an in-memory projection without writing through Prisma", async () => {
    courseMethods.findMany.mockResolvedValue(courseData());

    const response = await request(authenticatedApp(), `/api/courses/${courseId}/what-if`, {
      categoryId,
      earnedPoints: 92,
      possiblePoints: 100,
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      projection: {
        courseAveragePercentage: 90.34,
        letterGrade: "A",
        gradePoints: 4,
        cumulativeGpa: 3.75,
        gradedCreditHours: 4,
      },
    });
    expect(courseMethods.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "signed-in-user" } }),
    );

    for (const methods of [courseMethods, categoryMethods, assignmentMethods]) {
      expect(methods.create).not.toHaveBeenCalled();
      expect(methods.update).not.toHaveBeenCalled();
      expect(methods.upsert).not.toHaveBeenCalled();
      expect(methods.delete).not.toHaveBeenCalled();
    }
  });
});
