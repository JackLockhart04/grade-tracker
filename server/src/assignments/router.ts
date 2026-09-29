import { Router } from "express";
import { prisma } from "../database/prisma.js";

const maximumAssignmentNameLength = 150;
const maximumPoints = 99_999_999.99;

function cleanName(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const cleaned = value.trim();
  return cleaned.length > 0 && cleaned.length <= maximumAssignmentNameLength
    ? cleaned
    : undefined;
}

function cleanPoints(value: unknown, minimum: number): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  const rounded = Math.round(value * 100) / 100;
  if (
    Math.abs(value - rounded) > Number.EPSILON ||
    rounded < minimum ||
    rounded > maximumPoints
  ) {
    return undefined;
  }

  return rounded;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function serializeAssignment(assignment: {
  id: string;
  categoryId: string;
  name: string;
  earnedPoints: { toString(): string };
  possiblePoints: { toString(): string };
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: assignment.id,
    categoryId: assignment.categoryId,
    name: assignment.name,
    earnedPoints: Number(assignment.earnedPoints.toString()),
    possiblePoints: Number(assignment.possiblePoints.toString()),
    createdAt: assignment.createdAt.toISOString(),
    updatedAt: assignment.updatedAt.toISOString(),
  };
}

function parseAssignment(body: unknown) {
  if (!body || typeof body !== "object") {
    return undefined;
  }

  const input = body as Record<string, unknown>;
  const name = cleanName(input.name);
  const earnedPoints = cleanPoints(input.earnedPoints, 0);
  const possiblePoints = cleanPoints(input.possiblePoints, 0.01);

  if (!name || earnedPoints === undefined || possiblePoints === undefined) {
    return undefined;
  }

  return { name, earnedPoints, possiblePoints };
}

export function createAssignmentRouter() {
  const router = Router();

  router.get("/categories/:categoryId/assignments", async (request, response, next) => {
    try {
      if (!isUuid(request.params.categoryId)) {
        response.status(404).json({ error: "Category not found." });
        return;
      }

      const category = await prisma.category.findFirst({
        where: {
          id: request.params.categoryId,
          course: { userId: response.locals.userId as string },
        },
        select: { id: true },
      });

      if (!category) {
        response.status(404).json({ error: "Category not found." });
        return;
      }

      const assignments = await prisma.assignment.findMany({
        where: { categoryId: category.id },
        orderBy: { createdAt: "asc" },
      });

      response.json({ assignments: assignments.map(serializeAssignment) });
    } catch (error) {
      next(error);
    }
  });

  router.post("/categories/:categoryId/assignments", async (request, response, next) => {
    try {
      if (!isUuid(request.params.categoryId)) {
        response.status(404).json({ error: "Category not found." });
        return;
      }

      const input = parseAssignment(request.body);
      if (!input) {
        response.status(400).json({
          error: "Assignment name, non-negative earned points, and positive possible points are required. Points may have up to two decimal places.",
        });
        return;
      }

      const category = await prisma.category.findFirst({
        where: {
          id: request.params.categoryId,
          course: { userId: response.locals.userId as string },
        },
        select: { id: true },
      });

      if (!category) {
        response.status(404).json({ error: "Category not found." });
        return;
      }

      const assignment = await prisma.assignment.create({
        data: { categoryId: category.id, ...input },
      });

      response.status(201).json({ assignment: serializeAssignment(assignment) });
    } catch (error) {
      next(error);
    }
  });

  router.get("/assignments/:assignmentId", async (request, response, next) => {
    try {
      if (!isUuid(request.params.assignmentId)) {
        response.status(404).json({ error: "Assignment not found." });
        return;
      }

      const assignment = await prisma.assignment.findFirst({
        where: {
          id: request.params.assignmentId,
          category: { course: { userId: response.locals.userId as string } },
        },
      });

      if (!assignment) {
        response.status(404).json({ error: "Assignment not found." });
        return;
      }

      response.json({ assignment: serializeAssignment(assignment) });
    } catch (error) {
      next(error);
    }
  });

  router.patch("/assignments/:assignmentId", async (request, response, next) => {
    try {
      if (!isUuid(request.params.assignmentId)) {
        response.status(404).json({ error: "Assignment not found." });
        return;
      }

      const input = parseAssignment(request.body);
      if (!input) {
        response.status(400).json({
          error: "Assignment name, non-negative earned points, and positive possible points are required. Points may have up to two decimal places.",
        });
        return;
      }

      const current = await prisma.assignment.findFirst({
        where: {
          id: request.params.assignmentId,
          category: { course: { userId: response.locals.userId as string } },
        },
        select: { id: true },
      });

      if (!current) {
        response.status(404).json({ error: "Assignment not found." });
        return;
      }

      const assignment = await prisma.assignment.update({
        where: { id: current.id },
        data: input,
      });

      response.json({ assignment: serializeAssignment(assignment) });
    } catch (error) {
      next(error);
    }
  });

  router.delete("/assignments/:assignmentId", async (request, response, next) => {
    try {
      if (!isUuid(request.params.assignmentId)) {
        response.status(404).json({ error: "Assignment not found." });
        return;
      }

      const assignment = await prisma.assignment.findFirst({
        where: {
          id: request.params.assignmentId,
          category: { course: { userId: response.locals.userId as string } },
        },
        select: { id: true },
      });

      if (!assignment) {
        response.status(404).json({ error: "Assignment not found." });
        return;
      }

      await prisma.assignment.delete({ where: { id: assignment.id } });
      response.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
