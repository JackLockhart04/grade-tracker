# Architecture Decision Records

Architecture Decision Records (ADRs) document important technical choices for Grade Tracker. Each record explains the context, the selected approach, and its consequences.

| ADR | Decision | Status |
|-----|----------|--------|
| [ADR-001](001-postgresql-and-supabase.md) | PostgreSQL locally and Supabase for deployed database hosting | Accepted |
| [ADR-002](002-prisma-orm.md) | Prisma ORM 7 for database access and migrations | Accepted |
| [ADR-003](003-monorepo-structure.md) | One repository with separate React client and Express server workspaces | Accepted |
| [ADR-004](004-session-authentication.md) | Server-side session authentication with secure cookies | Accepted |
| [ADR-005](005-render-deployment.md) | Render hosts the combined production application | Accepted |

## Status meanings

- **Proposed:** Under discussion and not yet binding.
- **Accepted:** The team intends to implement this decision.
- **Superseded:** Replaced by a newer ADR.
- **Rejected:** Considered but not selected.

When a decision changes, preserve the original ADR and add a new record that supersedes it.
