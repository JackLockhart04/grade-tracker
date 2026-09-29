# ADR-003: Use one repository with separate client and server workspaces

- **Status:** Accepted
- **Date:** 2026-09-28
- **Owners:** Jack Lockhart and Emanuel Melvin

## Context

The Milestone 0 proposal selected React for the frontend and Node.js with Express for the backend. The team needs a repository structure that supports separate frontend and backend responsibilities while keeping setup, review, testing, tagging, and deployment manageable.

## Decision

Grade Tracker will remain in one Git repository organized as an npm workspace-based monorepo.

The initial structure will be:

```text
grade-tracker/
|-- client/             React and Vite frontend
|-- server/             Express API, Prisma, and calculation logic
|-- docs/               Requirements, design records, and diagrams
|-- package.json        Workspace configuration and shared commands
|-- .env.example        Safe configuration template
`-- README.md           Setup and verification instructions
```

Both `client` and `server` will use TypeScript. The root package will provide commands for development, builds, tests, and production startup. A shared package will not be introduced until both workspaces have a demonstrated need for shared code.

During local development, Vite will proxy `/api` requests to Express. In production, Express will serve the compiled React assets and the API from one origin.

## Rationale

A single repository makes milestone tags, pull requests, setup instructions, and contribution review straightforward. Separate workspaces preserve the frontend/backend division of responsibility without requiring two repositories or two release processes.

Serving the production client and API from one origin also simplifies session-cookie security and deployment.

## Consequences

### Positive

- One clone contains the complete application.
- A milestone tag identifies matching client and server versions.
- Root commands can build and verify the entire project.
- Frontend and backend changes can be reviewed together when necessary.
- Production avoids unnecessary cross-origin authentication configuration.

### Negative

- Root scripts must coordinate two workspaces.
- Pull requests may contain changes owned by both team members.
- The production server must be configured to serve the client build and support client-side routing.

## Alternatives considered

- **Separate repositories:** Strong separation, but adds coordination, versioning, and setup overhead for a two-person team.
- **Single undivided Node project:** Simpler initially, but makes frontend and backend boundaries less clear.
- **Full-stack framework:** Could reduce configuration, but would conflict with the React plus Express architecture already selected in the proposal.

## References

- [npm workspaces documentation](https://docs.npmjs.com/cli/using-npm/workspaces)
- [Vite guide](https://vite.dev/guide/)
