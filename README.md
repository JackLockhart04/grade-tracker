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
npm run dev
```

The React development server runs at `http://localhost:5173` and proxies `/api` requests to the Express server at `http://localhost:3000`.

Other root commands:

```bash
npm run build
npm test
npm start
```

`npm start` runs the compiled server and requires `npm run build` first. Verify the API at `GET /api/health`; a healthy server returns `{ "status": "ok" }`.

The Docker PostgreSQL container starts with an empty `grade_tracker` database. Follow the [local database development guide](docs/local-database-development.md) for setup, verification, shutdown, reset, and troubleshooting instructions.

## Branching

`main` is production. Work goes on feature branches and gets merged with a pull request. Every PR needs approval from the other team member.

## Definition of Done

A backlog item is Done when:
- [ ] Code is committed with a descriptive message
- [ ] It runs locally per the project setup instructions
- [ ] It does not break previously-passing verification steps
- [ ] New setup steps, environment variables, or database migrations are documented
