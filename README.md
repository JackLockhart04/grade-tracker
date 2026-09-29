# Grade Tracker

CS 415-001 Software Design & Development, Fall 2026, University of Alabama.

A web app for students to enter their assignment grades, set category weights for each class, and see their class averages and GPA update automatically. Also planned: a "what-if" calculator for hypothetical grades and read-only access for a parent or advisor.

**Team:** Jack Lockhart (jrlockhart2@crimson.ua.edu), Emanuel Melvin (emmelvin1@crimson.ua.edu)

## Status

Milestone 1 development. The repository contains a basic React and Express scaffold. Each milestone gets a git tag (`milestone-0`, `milestone-1`, ...).

## Planned stack

- Frontend: React
- Backend: Node.js + Express
- Database: PostgreSQL through Prisma ORM; Supabase will host the deployed database

## Files

- `docs/BACKLOG.md` - prioritized user stories
- `docs/architecture-diagram.md` - architecture diagram (Mermaid)
- `docs/adr/` - accepted architecture decision records
- `docs/local-database-development.md` - shared Docker PostgreSQL development setup

## Setup

Requires Node.js 24 or newer.

```bash
npm install
npm run db:start
npm run db:migrate
npm run dev
```

The React development server runs at `http://localhost:5173` and proxies `/api` requests to the Express server at `http://localhost:3000`.

Other root commands:

```bash
npm run build
npm test
npm start
```

`npm start` runs the compiled server and requires `npm run build` first. Verify the API at `GET /api/health`; a healthy server returns `{ "status": "ok" }`. `GET /api/ready` also checks the PostgreSQL connection and returns `{ "status": "ready" }` when the database is available.

The database currently contains the `User` model described in the Milestone 0 report and a session table for authentication. Registration and login use Argon2id password hashes and server-side sessions stored in PostgreSQL. Follow the [local database development guide](docs/local-database-development.md) for setup, migrations, verification, shutdown, reset, and troubleshooting instructions.

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
| `GET` | `/api/courses/:courseId` | Read a course and its categories |
| `PATCH` | `/api/courses/:courseId` | Update a course |
| `DELETE` | `/api/courses/:courseId` | Delete a course and its categories |
| `POST` | `/api/courses/:courseId/categories` | Add a weighted category |
| `PATCH` | `/api/categories/:categoryId` | Update a category |
| `DELETE` | `/api/categories/:categoryId` | Delete a category |

A course can be saved while its category weights total less than 100%. The API rejects any category change that would make the total exceed 100%.

## Branching

`main` is production. Work goes on feature branches and gets merged with a pull request. Every PR needs approval from the other team member.

## Definition of Done

A backlog item is Done when:
- [ ] Code is committed with a descriptive message
- [ ] It runs locally per the project setup instructions
- [ ] It does not break previously-passing verification steps
- [ ] New setup steps, environment variables, or database migrations are documented
