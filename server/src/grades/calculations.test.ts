import { describe, expect, it } from "vitest";
import {
  calculateCategoryGrade,
  calculateCourseGrade,
  calculateCumulativeGpa,
  calculateWhatIfProjection,
  gradeScale,
} from "./calculations.js";

describe("calculateCategoryGrade", () => {
  it("returns no average for an empty assignment collection", () => {
    expect(calculateCategoryGrade([])).toEqual({
      earnedPointsTotal: 0,
      possiblePointsTotal: 0,
      averagePercentage: null,
    });
  });

  it("calculates one assignment", () => {
    expect(calculateCategoryGrade([{ earnedPoints: 8, possiblePoints: 10 }])).toEqual({
      earnedPointsTotal: 8,
      possiblePointsTotal: 10,
      averagePercentage: 80,
    });
  });

  it("calculates multiple decimal assignments and rounds the result", () => {
    expect(
      calculateCategoryGrade([
        { earnedPoints: 8.25, possiblePoints: 10 },
        { earnedPoints: 9.1, possiblePoints: 10 },
      ]),
    ).toEqual({
      earnedPointsTotal: 17.35,
      possiblePointsTotal: 20,
      averagePercentage: 86.75,
    });
  });

  it("supports extra credit", () => {
    expect(calculateCategoryGrade([{ earnedPoints: 110, possiblePoints: 100 }])).toEqual({
      earnedPointsTotal: 110,
      possiblePointsTotal: 100,
      averagePercentage: 110,
    });
  });

  it("rounds floating-point totals to hundredths", () => {
    expect(
      calculateCategoryGrade([
        { earnedPoints: 0.1, possiblePoints: 0.2 },
        { earnedPoints: 0.2, possiblePoints: 0.4 },
      ]),
    ).toEqual({
      earnedPointsTotal: 0.3,
      possiblePointsTotal: 0.6,
      averagePercentage: 50,
    });
  });
});

describe("gradeScale", () => {
  it.each([
    [100, "A", 4],
    [90, "A", 4],
    [89.99, "B", 3],
    [80, "B", 3],
    [79.99, "C", 2],
    [70, "C", 2],
    [69.99, "D", 1],
    [60, "D", 1],
    [59.99, "F", 0],
  ])("maps %s to %s", (average, letterGrade, gradePoints) => {
    expect(gradeScale(average)).toEqual({ letterGrade, gradePoints });
  });
});

describe("calculateCourseGrade", () => {
  it("returns no grade for no categories", () => {
    expect(calculateCourseGrade([])).toEqual({
      currentAveragePercentage: null,
      gradedWeightPercentage: 0,
      letterGrade: null,
      gradePoints: null,
      categoryBreakdown: [],
    });
  });

  it("excludes empty categories and normalizes incomplete graded weights", () => {
    expect(
      calculateCourseGrade([
        { weightPercentage: 30, averagePercentage: 80 },
        { weightPercentage: 50, averagePercentage: 90 },
        { weightPercentage: 20, averagePercentage: null },
      ]),
    ).toEqual({
      currentAveragePercentage: 86.25,
      gradedWeightPercentage: 80,
      letterGrade: "B",
      gradePoints: 3,
      categoryBreakdown: [
        { effectiveWeightPercentage: 37.5, currentGradeContribution: 30 },
        { effectiveWeightPercentage: 62.5, currentGradeContribution: 56.25 },
        { effectiveWeightPercentage: null, currentGradeContribution: null },
      ],
    });
  });

  it("normalizes categories whose configured weights total less than 100", () => {
    const result = calculateCourseGrade([
      { weightPercentage: 20, averagePercentage: 100 },
      { weightPercentage: 30, averagePercentage: 50 },
    ]);

    expect(result.currentAveragePercentage).toBe(70);
    expect(result.gradedWeightPercentage).toBe(50);
    expect(result.categoryBreakdown).toEqual([
      { effectiveWeightPercentage: 40, currentGradeContribution: 40 },
      { effectiveWeightPercentage: 60, currentGradeContribution: 30 },
    ]);
  });

  it("rounds the weighted course average", () => {
    expect(
      calculateCourseGrade([
        { weightPercentage: 1, averagePercentage: 100 },
        { weightPercentage: 2, averagePercentage: 66.67 },
      ]).currentAveragePercentage,
    ).toBe(77.78);
  });
});

describe("calculateCumulativeGpa", () => {
  it("returns no GPA for courses without grades", () => {
    expect(calculateCumulativeGpa([{ creditHours: 3, gradePoints: null }])).toEqual({
      cumulativeGpa: null,
      gradedCreditHours: 0,
    });
  });

  it("weights GPA by graded credit hours and excludes ungraded courses", () => {
    expect(
      calculateCumulativeGpa([
        { creditHours: 3, gradePoints: 3 },
        { creditHours: 1, gradePoints: 4 },
        { creditHours: 4, gradePoints: null },
      ]),
    ).toEqual({ cumulativeGpa: 3.25, gradedCreditHours: 4 });
  });

  it("rounds GPA and graded credit hours", () => {
    expect(
      calculateCumulativeGpa([
        { creditHours: 1.25, gradePoints: 4 },
        { creditHours: 2, gradePoints: 3 },
      ]),
    ).toEqual({ cumulativeGpa: 3.38, gradedCreditHours: 3.25 });
  });
});

describe("calculateWhatIfProjection", () => {
  const courses = [
    {
      id: "course-1",
      creditHours: 3,
      categories: [
        {
          id: "homework",
          weightPercentage: 30,
          assignments: [{ earnedPoints: 8, possiblePoints: 10 }],
        },
        {
          id: "exams",
          weightPercentage: 50,
          assignments: [{ earnedPoints: 90, possiblePoints: 100 }],
        },
      ],
    },
    {
      id: "course-2",
      creditHours: 1,
      categories: [
        {
          id: "labs",
          weightPercentage: 100,
          assignments: [{ earnedPoints: 80, possiblePoints: 100 }],
        },
      ],
    },
  ];

  it("adds one hypothetical assignment only to the selected category", () => {
    const originalCourses = structuredClone(courses);

    expect(
      calculateWhatIfProjection(courses, "course-1", "homework", {
        earnedPoints: 92,
        possiblePoints: 100,
      }),
    ).toEqual({
      courseAveragePercentage: 90.34,
      letterGrade: "A",
      gradePoints: 4,
      cumulativeGpa: 3.75,
      gradedCreditHours: 4,
    });

    expect(courses).toEqual(originalCourses);
  });

  it("grades a previously ungraded course when its empty category receives an F", () => {
    expect(
      calculateWhatIfProjection(
        [
          {
            id: "selected",
            creditHours: 3,
            categories: [{ id: "empty", weightPercentage: 100, assignments: [] }],
          },
          {
            id: "still-ungraded",
            creditHours: 4,
            categories: [{ id: "empty-other", weightPercentage: 100, assignments: [] }],
          },
        ],
        "selected",
        "empty",
        { earnedPoints: 50, possiblePoints: 100 },
      ),
    ).toEqual({
      courseAveragePercentage: 50,
      letterGrade: "F",
      gradePoints: 0,
      cumulativeGpa: 0,
      gradedCreditHours: 3,
    });
  });

  it("supports decimal hypothetical scores", () => {
    expect(
      calculateWhatIfProjection(
        [
          {
            id: "selected",
            creditHours: 2,
            categories: [{ id: "homework", weightPercentage: 100, assignments: [] }],
          },
        ],
        "selected",
        "homework",
        { earnedPoints: 8.25, possiblePoints: 10 },
      ),
    ).toEqual({
      courseAveragePercentage: 82.5,
      letterGrade: "B",
      gradePoints: 3,
      cumulativeGpa: 3,
      gradedCreditHours: 2,
    });
  });

  it("supports extra-credit hypothetical scores", () => {
    expect(
      calculateWhatIfProjection(
        [
          {
            id: "selected",
            creditHours: 1,
            categories: [{ id: "labs", weightPercentage: 100, assignments: [] }],
          },
        ],
        "selected",
        "labs",
        { earnedPoints: 12.5, possiblePoints: 10 },
      ),
    ).toEqual({
      courseAveragePercentage: 125,
      letterGrade: "A",
      gradePoints: 4,
      cumulativeGpa: 4,
      gradedCreditHours: 1,
    });
  });

  it("replaces the selected course GPA contribution and leaves other courses unchanged", () => {
    const projectionCourses = [
      {
        id: "selected",
        creditHours: 3,
        categories: [
          {
            id: "exams",
            weightPercentage: 100,
            assignments: [{ earnedPoints: 80, possiblePoints: 100 }],
          },
        ],
      },
      {
        id: "other",
        creditHours: 1,
        categories: [
          {
            id: "projects",
            weightPercentage: 100,
            assignments: [{ earnedPoints: 70, possiblePoints: 100 }],
          },
        ],
      },
      {
        id: "ungraded",
        creditHours: 4,
        categories: [{ id: "empty", weightPercentage: 100, assignments: [] }],
      },
    ];
    const originalCourses = structuredClone(projectionCourses);

    expect(
      calculateWhatIfProjection(projectionCourses, "selected", "exams", {
        earnedPoints: 100,
        possiblePoints: 100,
      }),
    ).toEqual({
      courseAveragePercentage: 90,
      letterGrade: "A",
      gradePoints: 4,
      cumulativeGpa: 3.5,
      gradedCreditHours: 4,
    });
    expect(projectionCourses).toEqual(originalCourses);
  });

  it("returns null when the requested course is absent", () => {
    expect(
      calculateWhatIfProjection(courses, "missing", "homework", {
        earnedPoints: 92,
        possiblePoints: 100,
      }),
    ).toBeNull();
  });

  it("returns null when the requested category is absent", () => {
    expect(
      calculateWhatIfProjection(courses, "course-1", "missing", {
        earnedPoints: 92,
        possiblePoints: 100,
      }),
    ).toBeNull();
  });
});
