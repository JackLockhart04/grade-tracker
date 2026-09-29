# Grade Tracker

CS 415-001 Software Design & Development, Fall 2026, University of Alabama.

A web app for students to enter their assignment grades, set category weights for each class, and see their class averages and GPA update automatically. Also planned: a "what-if" calculator for hypothetical grades and read-only access for a parent or advisor.

**Team:** Jack Lockhart (jrlockhart2@crimson.ua.edu), Emanuel Melvin (emmelvin1@crimson.ua.edu)

## Status

Milestone 1 working MVP. The application supports authentication, course/category setup, assignment grade management, weighted course averages, and cumulative GPA. The `milestone-1` tag will be created when the submission version is finalized.

## Technology stack

- Frontend: React
- Backend: Node.js + Express
- Database: PostgreSQL through Prisma ORM; Supabase will host the deployed database

## Files

- `docs/BACKLOG.md` - prioritized user stories
- `docs/architecture-diagram.md` - architecture diagram (Mermaid)
- `docs/use-cases.md` - Milestone 1 use cases and acceptance outcomes
- `docs/analysis-model.md` - domain entities, rules, states, and data flow
- `docs/api-design.md` - HTTP interface contract and examples
- `docs/component-designs.md` - detailed authentication and grade-entry designs
- `docs/wireframes.md` - responsive, multi-screen UX wireframes
- `docs/design-patterns.md` - implemented design patterns and rationale
- `docs/verification-guide.md` - fresh-clone setup and Milestone 1 acceptance checks
- `docs/adr/` - accepted architecture decision records
- `docs/local-database-development.md` - shared Docker PostgreSQL development setup

## Setup

### Requirements

- Git
- Node.js 24 or newer, including npm
- Docker Desktop with Docker Compose

Run all commands from the repository root. Docker Desktop must be started manually and report that its engine is running before starting the project database.

### First-time setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create the untracked local environment file:

   PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

   macOS or Linux:

   ```bash
   cp .env.example .env
   ```

3. Replace the example `SESSION_SECRET` in `.env` with a long random value. Generate one with:

   ```bash
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```

4. Confirm Docker is available, then start the local PostgreSQL container:

   ```bash
   docker --version
   docker compose version
   npm run db:start
   ```

5. Apply all committed database migrations:

   ```bash
   npm run db:migrate
   ```

6. Start the React and Express development servers:

   ```bash
   npm run dev
   ```

Open `http://localhost:5173`. The React server proxies `/api` requests to the Express server at `http://localhost:3000`.

### Daily startup

After the first setup, the normal workflow is:

```bash
npm run db:start
npm run dev
```

Stop the development servers with `Ctrl+C`. Use `npm run db:stop` when the local database is no longer needed; normal shutdown preserves its data.

Other root commands:

```bash
npm run build
npm test
npm start
```

`npm start` runs the compiled server and requires `npm run build` first. Verify the API at `GET /api/health`; a healthy server returns `{ "status": "ok" }`. `GET /api/ready` also checks the PostgreSQL connection and returns `{ "status": "ready" }` when the database is available.

The database contains users, courses, weighted categories, assignments, and server-side sessions. Registration and login use Argon2id password hashes and sessions stored in PostgreSQL. Follow the [local database development guide](docs/local-database-development.md) for migrations, shutdown, reset, and troubleshooting. Follow the [Milestone 1 verification guide](docs/verification-guide.md) for the exact sample workflow and expected grade calculations.

## Authentication API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/auth/register` | Create an account and begin a session |
| `POST` | `/api/auth/login` | Log in with email and password |
| `POST` | `/api/auth/logout` | End the current session |
| `GET` | `/api/auth/me` | Return the current signed-in user |

Registration and login accept JSON containing `email` and `password`. Passwords must contain 12 to 128 characters. Authentication cookies are HTTP-only, use `SameSite=Lax`, and become secure cookies in production. Set a long, random `SESSION_SECRET` in every deployed environment.

## Course API

All course and category routes require an authenticated session.

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/courses` | List the signed-in student's courses |
| `POST` | `/api/courses` | Create a course |
| `GET` | `/api/courses/:courseId` | Read a course, its categories, and their assignments |
| `PATCH` | `/api/courses/:courseId` | Update a course |
| `DELETE` | `/api/courses/:courseId` | Delete a course and its categories |
| `POST` | `/api/courses/:courseId/categories` | Add a weighted category |
| `PATCH` | `/api/categories/:categoryId` | Update a category |
| `DELETE` | `/api/categories/:categoryId` | Delete a category |

A course can be saved while its category weights total less than 100%. The API rejects any category change that would make the total exceed 100%.

## Assignment API

All assignment routes require an authenticated session and only expose assignments belonging to the signed-in student.

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/categories/:categoryId/assignments` | List a category's assignments |
| `POST` | `/api/categories/:categoryId/assignments` | Add an assignment to a category |
| `GET` | `/api/assignments/:assignmentId` | Read an assignment |
| `PATCH` | `/api/assignments/:assignmentId` | Update an assignment |
| `DELETE` | `/api/assignments/:assignmentId` | Delete an assignment |

Assignment names are required. Earned points must be zero or greater, possible points must be greater than zero, and both accept up to two decimal places. Earned points may exceed possible points for extra credit. Deleting a category or course also deletes all assignments beneath it.

## Grade calculations

Grade values are calculated when course data is requested; they are not stored separately in the database.

- A category average is `total earned points / total possible points × 100`.
- A current course average is the weighted average of categories containing assignments.
- Categories without assignments are excluded instead of being treated as zero. The remaining graded weights are normalized to 100% for the current average.
- The API returns each graded category's normalized `effectiveWeightPercentage` and its `currentGradeContribution` in percentage points.
- A course without graded assignments has no current average and is excluded from cumulative GPA.
- Cumulative GPA is `sum(grade points × credit hours) / graded credit hours`.

The standard grade-point scale is:

| Current average | Letter | Grade points |
|-----------------|--------|--------------|
| 90% or higher | A | 4.0 |
| 80–89.99% | B | 3.0 |
| 70–79.99% | C | 2.0 |
| 60–69.99% | D | 1.0 |
| Below 60% | F | 0.0 |

Extra credit can raise a course average above 100%, but grade points remain capped at 4.0. Displayed calculations are rounded to two decimal places. Until all work is entered, the interface labels the result as a current grade rather than a final grade.

## Branching

`main` is production. Work goes on feature branches and gets merged with a pull request. Every PR needs approval from the other team member.

## Definition of Done

A backlog item is Done when:
- [ ] Code is committed with a descriptive message
- [ ] It runs locally per the project setup instructions
- [ ] It does not break previously-passing verification steps
- [ ] New setup steps, environment variables, or database migrations are documented
