export type LetterGrade = "A" | "B" | "C" | "D" | "F";

type AssignmentPoints = {
  earnedPoints: number;
  possiblePoints: number;
};

type CategoryGrade = {
  weightPercentage: number;
  averagePercentage: number | null;
};

type CourseGpaInput = {
  creditHours: number;
  gradePoints: number | null;
};

type WhatIfCourseInput = {
  id: string;
  creditHours: number;
  categories: Array<{
    id: string;
    weightPercentage: number;
    assignments: AssignmentPoints[];
  }>;
};

function roundToHundredths(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateCategoryGrade(assignments: AssignmentPoints[]) {
  const earnedPointsTotal = assignments.reduce(
    (total, assignment) => total + assignment.earnedPoints,
    0,
  );
  const possiblePointsTotal = assignments.reduce(
    (total, assignment) => total + assignment.possiblePoints,
    0,
  );

  return {
    earnedPointsTotal: roundToHundredths(earnedPointsTotal),
    possiblePointsTotal: roundToHundredths(possiblePointsTotal),
    averagePercentage:
      possiblePointsTotal > 0
        ? roundToHundredths((earnedPointsTotal / possiblePointsTotal) * 100)
        : null,
  };
}

export function gradeScale(averagePercentage: number) {
  if (averagePercentage >= 90) {
    return { letterGrade: "A" as LetterGrade, gradePoints: 4 };
  }
  if (averagePercentage >= 80) {
    return { letterGrade: "B" as LetterGrade, gradePoints: 3 };
  }
  if (averagePercentage >= 70) {
    return { letterGrade: "C" as LetterGrade, gradePoints: 2 };
  }
  if (averagePercentage >= 60) {
    return { letterGrade: "D" as LetterGrade, gradePoints: 1 };
  }

  return { letterGrade: "F" as LetterGrade, gradePoints: 0 };
}

export function calculateCourseGrade(categories: CategoryGrade[]) {
  const gradedCategories = categories.filter(
    (category): category is CategoryGrade & { averagePercentage: number } =>
      category.averagePercentage !== null,
  );
  const gradedWeightPercentage = gradedCategories.reduce(
    (total, category) => total + category.weightPercentage,
    0,
  );
  const categoryBreakdown = categories.map((category) => {
    if (category.averagePercentage === null || gradedWeightPercentage === 0) {
      return {
        effectiveWeightPercentage: null,
        currentGradeContribution: null,
      };
    }

    const effectiveWeightPercentage =
      (category.weightPercentage / gradedWeightPercentage) * 100;

    return {
      effectiveWeightPercentage: roundToHundredths(effectiveWeightPercentage),
      currentGradeContribution: roundToHundredths(
        category.averagePercentage * (effectiveWeightPercentage / 100),
      ),
    };
  });

  if (gradedWeightPercentage === 0) {
    return {
      currentAveragePercentage: null,
      gradedWeightPercentage: 0,
      letterGrade: null,
      gradePoints: null,
      categoryBreakdown,
    };
  }

  const weightedTotal = gradedCategories.reduce(
    (total, category) =>
      total + category.averagePercentage * category.weightPercentage,
    0,
  );
  const currentAveragePercentage = roundToHundredths(
    weightedTotal / gradedWeightPercentage,
  );
  const scale = gradeScale(currentAveragePercentage);

  return {
    currentAveragePercentage,
    gradedWeightPercentage: roundToHundredths(gradedWeightPercentage),
    ...scale,
    categoryBreakdown,
  };
}

export function calculateCumulativeGpa(courses: CourseGpaInput[]) {
  const gradedCourses = courses.filter(
    (course): course is CourseGpaInput & { gradePoints: number } =>
      course.gradePoints !== null,
  );
  const gradedCreditHours = gradedCourses.reduce(
    (total, course) => total + course.creditHours,
    0,
  );

  if (gradedCreditHours === 0) {
    return { cumulativeGpa: null, gradedCreditHours: 0 };
  }

  const qualityPoints = gradedCourses.reduce(
    (total, course) => total + course.gradePoints * course.creditHours,
    0,
  );

  return {
    cumulativeGpa: roundToHundredths(qualityPoints / gradedCreditHours),
    gradedCreditHours: roundToHundredths(gradedCreditHours),
  };
}

export function calculateWhatIfProjection(
  courses: WhatIfCourseInput[],
  courseId: string,
  categoryId: string,
  hypotheticalAssignment: AssignmentPoints,
) {
  const selectedCourse = courses.find((course) => course.id === courseId);
  if (!selectedCourse?.categories.some((category) => category.id === categoryId)) {
    return null;
  }

  let projectedCourseGrade: ReturnType<typeof calculateCourseGrade> | undefined;

  const projectedCourses = courses.map((course) => {
    const categoryGrades = course.categories.map((category) =>
      calculateCategoryGrade(
        course.id === courseId && category.id === categoryId
          ? [...category.assignments, hypotheticalAssignment]
          : category.assignments,
      ),
    );
    const courseGrade = calculateCourseGrade(
      course.categories.map((category, index) => ({
        weightPercentage: category.weightPercentage,
        averagePercentage: categoryGrades[index].averagePercentage,
      })),
    );

    if (course.id === courseId) {
      projectedCourseGrade = courseGrade;
    }

    return { creditHours: course.creditHours, gradePoints: courseGrade.gradePoints };
  });

  if (!projectedCourseGrade || projectedCourseGrade.currentAveragePercentage === null) {
    return null;
  }

  const gpa = calculateCumulativeGpa(projectedCourses);

  return {
    courseAveragePercentage: projectedCourseGrade.currentAveragePercentage,
    letterGrade: projectedCourseGrade.letterGrade,
    gradePoints: projectedCourseGrade.gradePoints,
    ...gpa,
  };
}
