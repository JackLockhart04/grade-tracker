# ADR-005: Deploy the combined application to Render

- **Status:** Accepted
- **Date:** 2026-09-28
- **Owners:** Jack Lockhart and Emanuel Melvin

## Context

The final project requires a public application URL, a continuous-deployment pipeline, and reproducible local setup. Grade Tracker consists of a React client, an Express API, and a PostgreSQL database. The team wants a free hosting option suitable for a course demonstration without creating unnecessary cross-origin authentication complexity.

## Decision

Grade Tracker will deploy as one Render Web Service connected to Supabase PostgreSQL.

- The production build will compile the React client and the Express server.
- Express will serve the compiled React files and all `/api` routes from the same Render domain.
- Render will receive configuration through environment variables, including `DATABASE_URL`, `SESSION_SECRET`, and `NODE_ENV`.
- The server will listen on Render's assigned `PORT` and bind to `0.0.0.0`.
- The application will provide `GET /api/health` for deployment verification.
- The application will not store persistent data on the Render filesystem.
- GitHub Actions will run required checks for pull requests and the main branch.
- Production deployment will occur only after the main-branch checks pass, using Render's Git integration or a deploy hook.
- Prisma will apply committed production migrations as part of the documented release process.
- Local setup instructions will remain supported even after public deployment.

## Rationale

A single Render service provides one public URL and keeps the React application and Express API on the same origin. This reduces deployment configuration and avoids unnecessary cross-origin cookie handling. Supabase supplies persistent PostgreSQL independently of Render's ephemeral application filesystem.

The design remains portable because the application depends on standard Node.js, PostgreSQL, and environment variables rather than provider-specific application APIs.

## Consequences

### Positive

- One deployment updates the frontend and backend together.
- Authentication cookies remain same-origin.
- Managed HTTPS and a public URL are provided by the host.
- GitHub-based CI/CD can satisfy the final milestone requirements.
- The database can persist independently of application restarts.

### Negative

- Render's free web service can sleep when idle, causing a slow first request.
- The team must warm and verify the application before a live demonstration.
- Free-tier policies can change and must be reviewed before Milestone 3.
- The build process must correctly produce and serve both client and server artifacts.

## Alternatives considered

- **Separate Vercel frontend and Render API:** Good static hosting, but introduces cross-origin cookie and CORS configuration plus a second deployment.
- **Koyeb:** A viable Node.js host, but Render offers a simpler path for the selected combined-service layout.
- **Railway or Fly.io:** Capable platforms, but their current free offerings are less suitable for a semester-long zero-cost deployment.
- **Render PostgreSQL:** Avoided because the free database is not appropriate for persistent semester-long data.

## References

- [Render web service documentation](https://render.com/docs/web-services)
- [Render free service limitations](https://render.com/docs/free)
- [Supabase platform documentation](https://supabase.com/docs)
