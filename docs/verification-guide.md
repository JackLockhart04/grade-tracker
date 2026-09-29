# Milestone 1 Setup and Verification Guide

This guide gives a teaching assistant or teammate a repeatable way to run and verify the exact Milestone 1 application. No account or sample data is preloaded; create the local demonstration account through the interface.

## 1. Required software

- Git
- Node.js 24 or newer with npm
- Docker Desktop with Docker Compose
- A current desktop browser such as Chrome, Edge, or Firefox

Docker Desktop must be started manually. Wait until it reports that the Docker engine is running.

## 2. Fresh-clone setup

Run from a terminal:

```bash
git clone https://github.com/JackLockhart04/grade-tracker.git
cd grade-tracker
npm install
```

Create the local environment file.

PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS or Linux:

```bash
cp .env.example .env
```

Generate a local session secret:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Paste that value after `SESSION_SECRET=` in `.env`. Keep the existing local `DATABASE_URL`, `NODE_ENV`, and `PORT` values.

Confirm Docker and start PostgreSQL:

```bash
docker --version
docker compose version
npm run db:start
npm run db:migrate
```

Expected results:

- `npm run db:start` reports that the `postgres` service is healthy.
- `npm run db:migrate` reports that the database schema is up to date after applying any pending committed migrations.

## 3. Build and automated smoke checks

```bash
npm run build
npm test
```

Expected results:

- The React client and Express server compile successfully.
- The server health/readiness test file passes all three tests.
- The client test command exits successfully even though Milestone 1 has no client test files yet.

## 4. Start and verify the services

Start both development servers:

```bash
npm run dev
```

Keep this command running. Verify these addresses:

| Address | Expected result |
|---------|-----------------|
| `http://localhost:5173` | Grade Tracker authentication screen |
| `http://localhost:3000/api/health` | `{ "status": "ok" }` |
| `http://localhost:3000/api/ready` | `{ "status": "ready" }` |

If readiness reports `503`, check Docker and the database troubleshooting steps in [local-database-development.md](local-database-development.md).

## 5. Verify authentication

Register this disposable local account through the browser:

| Field | Sample value |
|-------|--------------|
| Email | `ta.milestone1@example.com` |
| Password | `Milestone1Demo!` |

Verify:

1. Registration opens the course dashboard.
2. Log out, then attempt an incorrect password. The application displays a generic invalid-credentials error.
3. Log in with the sample password.
4. Refresh the browser. The authenticated session and saved data remain available.

## 6. Verify course, category, and assignment management

### Course A: Software Engineering

Create this course:

| Field | Value |
|-------|-------|
| Course name | `Software Engineering` |
| Term | `Fall 2026` |
| Credit hours | `3` |

Add these categories:

| Category | Weight |
|----------|--------|
| Homework | 30% |
| Exams | 50% |
| Projects | 20% |

The course should report a 100% category configuration.

Add these assignments:

| Category | Assignment | Earned | Possible | Expected category average |
|----------|------------|--------|----------|---------------------------|
| Homework | Homework 1 | 8 | 10 | 80.00% |
| Exams | Exam 1 | 90 | 100 | 90.00% |

Leave Projects empty. Verify the course displays:

- Homework current-grade share: 37.50%.
- Homework contribution: 30.00 percentage points.
- Exams current-grade share: 62.50%.
- Exams contribution: 56.25 percentage points.
- Projects: no grade and no contribution.
- Current course average: **86.25%**.
- Letter grade: **B**.
- Dashboard GPA with only this graded course: **3.00**, based on 3 graded credit hours.

The calculation is:

```text
(80 x 30 + 90 x 50) / (30 + 50) = 86.25
```

The empty Projects category is excluded rather than treated as zero.

### Course B: Databases

Create a second course:

| Field | Value |
|-------|-------|
| Course name | `Databases` |
| Term | `Fall 2026` |
| Credit hours | `1` |

Add one category named `Labs` at 100%. Add `Bonus Lab` with 110 earned points out of 100 possible points.

Verify:

- Databases average: **110.00%**.
- Letter grade: **A**.
- Grade points remain capped at **4.0**.
- Cumulative GPA becomes **3.25**, based on 4 graded credit hours.

```text
((3.0 x 3 credits) + (4.0 x 1 credit)) / 4 credits = 3.25
```

### Course C: History

Create `History`, `Fall 2026`, with 4 credit hours, but do not add an assignment.

Verify:

- History displays “No grade yet.”
- The cumulative GPA remains **3.25**.
- Graded credit hours remain **4**, because ungraded courses are excluded.

## 7. Verify automatic recalculation and CRUD

1. Edit Homework 1 from 8/10 to 10/10.
2. Confirm Software Engineering updates immediately to **93.75%**, letter **A**.
3. Confirm cumulative GPA updates to **4.00**.
4. Edit an assignment name and confirm the new name remains after a browser refresh.
5. Add a temporary assignment, delete it, and confirm it disappears.
6. Add a temporary category containing an assignment, delete the category, and confirm its assignments disappear with it.

The updated Software Engineering calculation is:

```text
(100 x 30 + 90 x 50) / (30 + 50) = 93.75
```

## 8. Verify privacy between users

1. Log out of the demonstration account.
2. Register `ta.second@example.com` with a different valid password.
3. Confirm the new account has an empty dashboard and cannot see the first account's courses.
4. Log out and return to the first account to confirm its data remains unchanged.

## 9. Verify persistence and responsive behavior

1. Stop `npm run dev` with `Ctrl+C`.
2. Start it again with `npm run dev`.
3. Log in and confirm the courses, categories, assignments, and calculations remain.
4. Resize the browser to a phone-width viewport.
5. Confirm forms and cards stack vertically and the grade-breakdown table scrolls horizontally.
6. Use the keyboard to tab through forms and buttons; focus should remain visible and every input should have a readable label.

## 10. Stop the local environment

Stop the development servers with `Ctrl+C`, then stop PostgreSQL:

```bash
npm run db:stop
```

Normal shutdown preserves the local demonstration data. Database reset instructions are in [local-database-development.md](local-database-development.md).

## Verification checklist

- [ ] Fresh dependencies install successfully.
- [ ] PostgreSQL becomes healthy and migrations apply.
- [ ] Production build succeeds.
- [ ] Existing automated smoke tests pass.
- [ ] Registration, logout, failed login, and valid login work.
- [ ] Course/category/assignment create, edit, and delete work.
- [ ] Course averages and contribution breakdown match the expected values.
- [ ] Extra credit is supported and grade points remain capped at 4.0.
- [ ] Cumulative GPA is weighted by graded credit hours.
- [ ] A second user cannot see the first user's data.
- [ ] Data persists after restarting the application.
- [ ] The interface remains usable at a phone-width viewport and by keyboard.
