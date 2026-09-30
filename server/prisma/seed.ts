import { argon2id, hash } from "argon2";
import { environment } from "../src/config/environment.js";
import { prisma } from "../src/database/prisma.js";

// Loads a demonstration account with the sample courses from docs/verification-guide.md.
// Running it again replaces the demo account's data; other accounts are not touched.

const demoEmail = "demo@example.com";
const demoPassword = "DemoAccount2026!";

const courses = [
  {
    name: "Software Engineering",
    term: "Fall 2026",
    creditHours: 3,
    categories: [
      { name: "Homework", weightPercentage: 30, assignments: [{ name: "Homework 1", earnedPoints: 8, possiblePoints: 10 }] },
      { name: "Exams", weightPercentage: 50, assignments: [{ name: "Exam 1", earnedPoints: 90, possiblePoints: 100 }] },
      { name: "Projects", weightPercentage: 20, assignments: [] },
    ],
  },
  {
    name: "Databases",
    term: "Fall 2026",
    creditHours: 1,
    categories: [
      { name: "Labs", weightPercentage: 100, assignments: [{ name: "Bonus Lab", earnedPoints: 110, possiblePoints: 100 }] },
    ],
  },
  {
    name: "History",
    term: "Fall 2026",
    creditHours: 4,
    categories: [],
  },
];

async function main() {
  if (environment.nodeEnv === "production") {
    throw new Error("Refusing to seed demonstration data while NODE_ENV is production.");
  }

  await prisma.user.deleteMany({ where: { email: demoEmail } });

  const passwordHash = await hash(demoPassword, { type: argon2id });
  await prisma.user.create({
    data: {
      email: demoEmail,
      passwordHash,
      courses: {
        create: courses.map((course) => ({
          name: course.name,
          term: course.term,
          creditHours: course.creditHours,
          categories: {
            create: course.categories.map((category) => ({
              name: category.name,
              weightPercentage: category.weightPercentage,
              assignments: { create: category.assignments },
            })),
          },
        })),
      },
    },
  });

  console.log(`Seeded ${demoEmail} (password: ${demoPassword}) with ${courses.length} courses.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
