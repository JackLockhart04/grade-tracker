import { Router } from "express";
import { prisma } from "../database/prisma.js";
import {
  calculateCategoryGrade,
  calculateCourseGrade,
  calculateCumulativeGpa,
} from "../grades/calculations.js";

const maximumCourseNameLength = 150;
const maximumTermLength = 100;
const maximumCategoryNameLength = 100;

class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function cleanText(value: unknown, maximumLength: number): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const cleaned = value.trim();
  return cleaned.length > 0 && cleaned.length <= maximumLength
    ? cleaned
    : undefined;
}

function cleanNumber(
  value: unknown,
  minimum: number,
  maximum: number,
  decimalPlaces: number,
): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  const multiplier = 10 ** decimalPlaces;
  const rounded = Math.round(value * multiplier) / multiplier;
  if (Math.abs(value - rounded) > Number.EPSILON || rounded < minimum || rounded > maximum) {
    return undefined;
  }

  return rounded;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function numberValue(value: { toString(): string }): number {
  return Number(value.toString());
}

type AssignmentData = {
  id: string;
  categoryId: string;
  name: string;
  earnedPoints: { toString(): string };
  possiblePoints: { toString(): string };
  createdAt: Date;
  updatedAt: Date;
};

function serializeAssignment(assignment: AssignmentData) {
  return {
    id: assignment.id,
    categoryId: assignment.categoryId,
    name: assignment.name,
    earnedPoints: numberValue(assignment.earnedPoints),
    possiblePoints: numberValue(assignment.possiblePoints),
    createdAt: assignment.createdAt.toISOString(),
    updatedAt: assignment.updatedAt.toISOString(),
  };
}

function serializeCategory(category: {
  id: string;
  courseId: string;
  name: string;
  weightPercentage: { toString(): string };
  createdAt: Date;
  updatedAt: Date;
  assignments?: AssignmentData[];
}) {
  const assignments = (category.assignments ?? []).map(serializeAssignment);
  const grade = calculateCategoryGrade(assignments);

  return {
    id: category.id,
    courseId: category.courseId,
    name: category.name,
    weightPercentage: numberValue(category.weightPercentage),
    assignments,
    ...grade,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

function serializeCourse(course: {
  id: string;
  name: string;
  term: string;
  creditHours: { toString(): string };
  createdAt: Date;
  updatedAt: Date;
  categories: Array<{
    id: string;
    courseId: string;
    name: string;
    weightPercentage: { toString(): string };
    createdAt: Date;
    updatedAt: Date;
    assignments?: AssignmentData[];
  }>;
}) {
  const categories = course.categories.map(serializeCategory);
  const totalWeight = Math.round(
    categories.reduce((total, category) => total + category.weightPercentage, 0) * 100,
  ) / 100;
  const { categoryBreakdown, ...grade } = calculateCourseGrade(categories);
  const categoriesWithBreakdown = categories.map((category, index) => ({
    ...category,
    ...categoryBreakdown[index],
  }));

  return {
    id: course.id,
    name: course.name,
    term: course.term,
    creditHours: numberValue(course.creditHours),
    categories: categoriesWithBreakdown,
    totalWeight,
    configurationComplete: totalWeight === 100,
    ...grade,
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
  };
}

const courseSelection = {
  id: true,
  name: true,
  term: true,
  creditHours: true,
  createdAt: true,
  updatedAt: true,
  categories: {
    orderBy: { createdAt: "asc" as const },
    include: {
      assignments: {
        orderBy: { createdAt: "asc" as const },
      },
    },
  },
};

function isUniqueConstraintError(error: unknown): boolean {
  return Boolean(
    error && typeof error === "object" && "code" in error && error.code === "P2002",
  );
}

export function createCourseRouter() {
  const router = Router();

  router.get("/courses", async (_request, response, next) => {
    try {
      const courses = await prisma.course.findMany({
        where: { userId: response.locals.userId as string },
        select: courseSelection,
        orderBy: { createdAt: "asc" },
      });

      const serializedCourses = courses.map(serializeCourse);
      const gpa = calculateCumulativeGpa(serializedCourses);

      response.json({ courses: serializedCourses, ...gpa });
    } catch (error) {
      next(error);
    }
  });

  router.post("/courses", async (request, response, next) => {
    try {
      const name = cleanText(request.body?.name, maximumCourseNameLength);
      const term = cleanText(request.body?.term, maximumTermLength);
      const creditHours = cleanNumber(request.body?.creditHours, 0.5, 30, 1);

      if (!name || !term || creditHours === undefined) {
        response.status(400).json({
          error: "Course name, term, and credit hours between 0.5 and 30 are required.",
        });
        return;
      }

      const course = await prisma.course.create({
        data: {
          userId: response.locals.userId as string,
          name,
          term,
          creditHours,
        },
        select: courseSelection,
      });

      response.status(201).json({ course: serializeCourse(course) });
    } catch (error) {
      next(error);
    }
  });

  router.get("/courses/:courseId", async (request, response, next) => {
    try {
      if (!isUuid(request.params.courseId)) {
        response.status(404).json({ error: "Course not found." });
        return;
      }

      const course = await prisma.course.findFirst({
        where: {
          id: request.params.courseId,
          userId: response.locals.userId as string,
        },
        select: courseSelection,
      });

      if (!course) {
        response.status(404).json({ error: "Course not found." });
        return;
      }

      response.json({ course: serializeCourse(course) });
    } catch (error) {
      next(error);
    }
  });

  router.patch("/courses/:courseId", async (request, response, next) => {
    try {
      if (!isUuid(request.params.courseId)) {
        response.status(404).json({ error: "Course not found." });
        return;
      }

      const current = await prisma.course.findFirst({
        where: {
          id: request.params.courseId,
          userId: response.locals.userId as string,
        },
        select: { id: true },
      });

      if (!current) {
        response.status(404).json({ error: "Course not found." });
        return;
      }

      const name = cleanText(request.body?.name, maximumCourseNameLength);
      const term = cleanText(request.body?.term, maximumTermLength);
      const creditHours = cleanNumber(request.body?.creditHours, 0.5, 30, 1);

      if (!name || !term || creditHours === undefined) {
        response.status(400).json({
          error: "Course name, term, and credit hours between 0.5 and 30 are required.",
        });
        return;
      }

      const course = await prisma.course.update({
        where: { id: current.id },
        data: { name, term, creditHours },
        select: courseSelection,
      });

      response.json({ course: serializeCourse(course) });
    } catch (error) {
      next(error);
    }
  });

  router.delete("/courses/:courseId", async (request, response, next) => {
    try {
      if (!isUuid(request.params.courseId)) {
        response.status(404).json({ error: "Course not found." });
        return;
      }

      const course = await prisma.course.findFirst({
        where: {
          id: request.params.courseId,
          userId: response.locals.userId as string,
        },
        select: { id: true },
      });

      if (!course) {
        response.status(404).json({ error: "Course not found." });
        return;
      }

      await prisma.course.delete({ where: { id: course.id } });
      response.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  router.post("/courses/:courseId/categories", async (request, response, next) => {
    try {
      if (!isUuid(request.params.courseId)) {
        response.status(404).json({ error: "Course not found." });
        return;
      }

      const name = cleanText(request.body?.name, maximumCategoryNameLength);
      const weightPercentage = cleanNumber(request.body?.weightPercentage, 0.01, 100, 2);

      if (!name || weightPercentage === undefined) {
        response.status(400).json({
          error: "Category name and a weight greater than 0 and no more than 100 are required.",
        });
        return;
      }

      const category = await prisma.$transaction(async (transaction) => {
        const course = await transaction.course.findFirst({
          where: {
            id: request.params.courseId,
            userId: response.locals.userId as string,
          },
          select: { id: true },
        });

        if (!course) {
          throw new ApiError(404, "Course not found.");
        }

        const totals = await transaction.category.aggregate({
          where: { courseId: course.id },
          _sum: { weightPercentage: true },
        });
        const currentTotal = totals._sum.weightPercentage
          ? numberValue(totals._sum.weightPercentage)
          : 0;

        if (currentTotal + weightPercentage > 100) {
          throw new ApiError(400, "Category weights cannot total more than 100%.");
        }

        return transaction.category.create({
          data: { courseId: course.id, name, weightPercentage },
        });
      });

      response.status(201).json({ category: serializeCategory(category) });
    } catch (error) {
      if (error instanceof ApiError) {
        response.status(error.status).json({ error: error.message });
        return;
      }
      if (isUniqueConstraintError(error)) {
        response.status(409).json({ error: "That category name is already in use." });
        return;
      }
      next(error);
    }
  });

  router.patch("/categories/:categoryId", async (request, response, next) => {
    try {
      if (!isUuid(request.params.categoryId)) {
        response.status(404).json({ error: "Category not found." });
        return;
      }

      const name = cleanText(request.body?.name, maximumCategoryNameLength);
      const weightPercentage = cleanNumber(request.body?.weightPercentage, 0.01, 100, 2);

      if (!name || weightPercentage === undefined) {
        response.status(400).json({
          error: "Category name and a weight greater than 0 and no more than 100 are required.",
        });
        return;
      }

      const category = await prisma.$transaction(async (transaction) => {
        const current = await transaction.category.findFirst({
          where: {
            id: request.params.categoryId,
            course: { userId: response.locals.userId as string },
          },
          select: { id: true, courseId: true },
        });

        if (!current) {
          throw new ApiError(404, "Category not found.");
        }

        const totals = await transaction.category.aggregate({
          where: {
            courseId: current.courseId,
            id: { not: current.id },
          },
          _sum: { weightPercentage: true },
        });
        const otherWeight = totals._sum.weightPercentage
          ? numberValue(totals._sum.weightPercentage)
          : 0;

        if (otherWeight + weightPercentage > 100) {
          throw new ApiError(400, "Category weights cannot total more than 100%.");
        }

        return transaction.category.update({
          where: { id: current.id },
          data: { name, weightPercentage },
        });
      });

      response.json({ category: serializeCategory(category) });
    } catch (error) {
      if (error instanceof ApiError) {
        response.status(error.status).json({ error: error.message });
        return;
      }
      if (isUniqueConstraintError(error)) {
        response.status(409).json({ error: "That category name is already in use." });
        return;
      }
      next(error);
    }
  });

  router.delete("/categories/:categoryId", async (request, response, next) => {
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

      await prisma.category.delete({ where: { id: category.id } });
      response.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
