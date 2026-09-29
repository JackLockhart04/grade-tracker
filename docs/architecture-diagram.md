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

## Design types and operations

Grade Tracker uses functional React components and router factories instead of requiring every responsibility to be represented by a JavaScript class. The following design-level view is the TypeScript equivalent of a design-class diagram: it shows the principal components, interfaces, public operations, and dependencies without implying runtime classes that do not exist in the source.

```mermaid
classDiagram
    class App {
        +render authentication state
        +loadCurrentUser()
        +register()
        +login()
        +logout()
    }

    class Dashboard {
        +loadCourses()
        +openCourse(courseId)
        +addCourse()
        +deleteCourse()
    }

    class CourseDetail {
        +updateCourse()
        +addCategory()
        +refreshSelectedCourse()
    }

    class CategoryRow {
        +save()
        +remove()
        +addAssignment()
    }

    class AssignmentRow {
        +save()
        +remove()
    }

    class AuthRouter {
        +register
        +login
        +logout
        +currentUser
    }

    class CourseRouter {
        +listCourses
        +createCourse
        +readCourse
        +updateCourse
        +deleteCourse
        +manageCategories
    }

    class AssignmentRouter {
        +listAssignments
        +createAssignment
        +readAssignment
        +updateAssignment
        +deleteAssignment
    }

    class GradeCalculations {
        +calculateCategoryGrade(assignments)
        +calculateCourseGrade(categories)
        +calculateCumulativeGpa(courses)
        +gradeScale(averagePercentage)
    }

    class PrismaClient {
        +user
        +course
        +category
        +assignment
        +session
    }

    App --> Dashboard
    Dashboard *-- CourseDetail
    CourseDetail *-- CategoryRow
    CategoryRow *-- AssignmentRow
    App ..> AuthRouter : JSON over HTTP
    Dashboard ..> CourseRouter : JSON over HTTP
    CourseDetail ..> CourseRouter : JSON over HTTP
    CategoryRow ..> AssignmentRouter : JSON over HTTP
    AssignmentRow ..> AssignmentRouter : JSON over HTTP
    CourseRouter --> GradeCalculations
    AuthRouter --> PrismaClient
    CourseRouter --> PrismaClient
    AssignmentRouter --> PrismaClient
```

The request and response structures shared across these boundaries are defined in [api-design.md](api-design.md). The persisted relationships and invariants are defined in [analysis-model.md](analysis-model.md).
