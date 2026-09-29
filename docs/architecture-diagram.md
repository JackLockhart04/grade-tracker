# Milestone 1 Architecture and Module Boundaries

The Milestone 1 application is a React client backed by one Express API and PostgreSQL database. The browser communicates only through `/api` routes. Express middleware establishes the session and authenticated user before protected routers run. Prisma is the only module that talks directly to PostgreSQL.

```mermaid
flowchart LR
    Student[Student]

    subgraph Browser[React client]
        App[App and authentication forms]
        Dashboard[Course dashboard]
        GradeUI[Category and assignment UI]
    end

    subgraph API[Express server]
        Session[Session middleware]
        Auth[Authentication router]
        Guard[Authentication guard]
        Courses[Course and category router]
        Assignments[Assignment router]
        Calculations[Grade calculation service]
        Health[Health and readiness routes]
    end

    subgraph Data[Data layer]
        Prisma[Prisma client]
        PostgreSQL[(PostgreSQL)]
    end

    Student --> App
    App --> Dashboard
    Dashboard --> GradeUI

    App -->|register, login, logout, me| Session
    GradeUI -->|course and grade requests| Session
    Session --> Auth
    Session --> Guard
    Guard --> Courses
    Guard --> Assignments
    Courses --> Calculations

    Auth --> Prisma
    Courses --> Prisma
    Assignments --> Prisma
    Health --> Prisma
    Prisma --> PostgreSQL
```

## Boundary rules

- The React client renders state and sends JSON requests; it does not access the database or calculate authoritative grades.
- Session middleware loads the signed session. The authentication guard rejects protected requests without a user ID.
- Routers validate HTTP input, enforce ownership, coordinate Prisma operations, and serialize responses.
- The calculation service contains pure category, course, letter-grade, and GPA formulas. It never writes data.
- Prisma owns database queries and migrations. PostgreSQL constraints protect point ranges, weights, relationships, and cascade deletion.
- What-if simulation and guest viewing are intentionally outside this Milestone 1 boundary.
