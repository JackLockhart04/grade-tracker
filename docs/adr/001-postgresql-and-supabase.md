# ADR-001: Use PostgreSQL with Supabase for deployed database hosting

- **Status:** Accepted
- **Date:** 2026-09-28
- **Owners:** Jack Lockhart and Emanuel Melvin

## Context

Grade Tracker stores structured, related data for users, academic terms, courses, weighted categories, assignments, grades, and sessions. The application must run locally during development and eventually be deployed at a public URL. The Milestone 0 proposal selected a relational SQL database but did not choose a specific product.

The database choice should support relationships and constraints, work with the Node.js backend, and avoid a database conversion before deployment.

## Decision

Grade Tracker will use PostgreSQL in every environment.

- Each developer will use a local PostgreSQL database for routine development and testing.
- The deployed application will use a Supabase-hosted PostgreSQL database.
- Supabase will initially be used only as database hosting. Authentication and application behavior will remain in the Express backend.
- Database connection details will be supplied through `DATABASE_URL` and will never be committed to Git.
- Development and deployed data will remain separate.

## Rationale

PostgreSQL matches the relational nature of the project and provides foreign keys, transactions, uniqueness rules, and other constraints that help protect grade data. Using PostgreSQL locally and in production keeps behavior consistent and avoids migrating from a development-only database later.

Supabase provides managed PostgreSQL suitable for the planned public deployment while allowing the application to remain portable to another PostgreSQL host.

## Consequences

### Positive

- Development and production use the same database engine.
- Relationships and ownership rules can be enforced at the database level.
- The application is not tied to Supabase-specific APIs.
- The database can move to another PostgreSQL provider by changing configuration.

### Negative

- Developers must run or otherwise access PostgreSQL locally.
- Database migrations and environment configuration must be documented carefully.
- Free hosting limits and inactivity policies must be monitored before demonstrations.

## Alternatives considered

- **SQLite:** Easier initial setup, but its deployment and concurrency characteristics differ from PostgreSQL and could require a later migration.
- **MySQL:** Capable of supporting the project, but it provides no clear advantage for this use case.
- **Render PostgreSQL:** Conveniently colocated with the application, but the free database offering is not suitable for semester-long persistence because of its expiration policy.

## References

- [PostgreSQL documentation](https://www.postgresql.org/docs/)
- [Supabase database documentation](https://supabase.com/docs/guides/database/overview)
