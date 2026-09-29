# Milestone 1 Design Patterns

## Pattern 1: Layered architecture with a domain service

### Structure

Grade Tracker separates presentation, HTTP coordination, domain calculation, and persistence:

```text
React presentation
        |
Express routes and middleware
        |
Pure grade calculation service
        |
Prisma data access
        |
PostgreSQL
```

### Implemented evidence

- `client/src/App.tsx` and `client/src/Dashboard.tsx` own browser presentation and interaction state.
- `server/src/auth/router.ts`, `server/src/courses/router.ts`, and `server/src/assignments/router.ts` own HTTP validation and response behavior.
- `server/src/grades/calculations.ts` owns pure grade formulas without Express or Prisma dependencies.
- `server/src/database/prisma.ts` creates the database client used by server modules.

### Why it fits

Grade calculations are the highest-risk domain rule. Keeping them in one pure service prevents the UI and persistence code from implementing slightly different formulas. Derived values can be recalculated after every assignment change without storing redundant summary columns. The boundary also supports future unit tests and the non-persisted what-if feature without changing database records.

### Tradeoffs

- Routers still call Prisma directly rather than through repository classes, which keeps the small project simple but couples route coordination to Prisma query shapes.
- Some response serialization remains in the course router. A larger application could move it into dedicated application services.

## Pattern 2: Middleware pipeline for cross-cutting concerns

### Structure

Express processes requests through ordered middleware:

```text
JSON parsing -> session loading -> public routes or authentication guard
             -> protected router -> centralized error handler
```

### Implemented evidence

- `express.json()` parses request bodies once for every route.
- `createSessionMiddleware()` loads PostgreSQL-backed session state.
- `requireAuthentication` protects course, category, and assignment routers and places the trusted user ID in `response.locals`.
- The final error middleware returns a consistent `500` response for unexpected failures.

### Why it fits

Authentication is required by many endpoints. A middleware guard applies the rule once instead of relying on every handler to remember a separate login check. Public health and authentication endpoints remain outside the guard, while all academic-data endpoints share the same protection. This makes the authorization boundary visible in `server/src/app.ts`.

### Tradeoffs

- Middleware order is significant; mounting a protected router before the session middleware would break authentication.
- Authentication middleware proves identity, while individual routers must still enforce ownership of the requested resource.

## Related technique: Dependency injection for readiness checks

`createApp` accepts an optional `checkDatabase` function. Production uses the real PostgreSQL readiness check, while the existing health tests supply controlled success and failure functions. This small dependency-injection seam improves verification without introducing a full dependency-injection framework.
