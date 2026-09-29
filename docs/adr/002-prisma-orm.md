# ADR-002: Use Prisma ORM 7 for database access and migrations

- **Status:** Accepted
- **Date:** 2026-09-28
- **Owners:** Jack Lockhart and Emanuel Melvin

## Context

The Express backend needs to create, read, update, and delete related PostgreSQL records. The team also needs a repeatable way to create and update the database schema on each developer's computer and in the deployed environment.

The project could use raw SQL, a query builder, or an object-relational mapper. The selected approach should remain understandable for a two-person team and make schema changes reproducible for the TA.

## Decision

Grade Tracker will use Prisma ORM 7 for PostgreSQL access and schema migrations.

- The Prisma schema will be stored in `server/prisma/schema.prisma`.
- Generated migrations will be committed to Git.
- Development schema changes will use Prisma's development migration workflow.
- Deployment will apply committed migrations rather than creating schema changes dynamically.
- The installed Prisma version will be pinned by the package lockfile.
- Grade calculations and other business rules will live in service or calculation modules, not in route handlers or the Prisma schema.
- Raw SQL may be used only when Prisma cannot express a necessary operation clearly, and such uses must be documented and tested.

## Rationale

Prisma provides a readable data model, generated type-safe queries, version-controlled migrations, and tools for inspecting development data. These features reduce repetitive database code and make it easier for both team members to work from the same schema.

Prisma ORM 7 is selected instead of a release-candidate major version to reduce toolchain risk during the semester.

## Consequences

### Positive

- Database queries are checked against generated TypeScript types.
- Schema history is recorded and repeatable.
- Relationships between users, terms, courses, categories, and assignments are visible in one model.
- Local and deployed databases can be updated using the same migration files.

### Negative

- The team must learn Prisma's schema and migration workflow.
- Generated client code adds a build step.
- Complex queries may still require PostgreSQL knowledge or raw SQL.
- Upgrading Prisma major versions during the semester would require deliberate testing and a new decision.

## Alternatives considered

- **Raw SQL with `pg`:** Provides maximum control but requires more mapping, validation, and migration work.
- **Sequelize:** Mature and capable, but Prisma offers a more direct schema-first and type-safe workflow for this TypeScript project.
- **Prisma ORM 8 release candidate:** Newer, but a pre-release dependency adds avoidable risk to a deadline-driven project.

## References

- [Prisma ORM 7 documentation](https://www.prisma.io/docs/orm/v7)
- [Prisma PostgreSQL quickstart](https://www.prisma.io/docs/v7/prisma-orm/quickstart/postgresql)
