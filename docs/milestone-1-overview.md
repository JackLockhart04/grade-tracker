# Milestone 1 Product and Process Overview

## Product brief

Grade Tracker is a responsive web application for students who want one place to record grades and understand their current academic standing. A signed-in student can create courses, define weighted grading categories, record assignment scores, and see course averages and cumulative GPA update automatically.

The application addresses a common problem with learning-management systems: grades may be spread across courses, calculated with different category weights, or displayed without a clear explanation. Grade Tracker keeps the source data and the calculation breakdown visible so a student can reproduce and understand each result.

## Target user and value

The primary user is a college student managing several courses. The Milestone 1 value proposition is:

> Enter each real grade once and immediately see an understandable, current course average and credit-hour-weighted GPA.

All academic data is private to the account that created it. The application is intended as a planning aid; displayed values are estimates based on the information entered by the student and are not official university records.

## Milestone 1 MVP scope

Milestone 1 implements the first four prioritized user stories:

| Story | Delivered capability |
|-------|----------------------|
| US-01 | Register, sign in, remain signed in across refreshes, and sign out securely |
| US-02 | Create, edit, and delete courses and weighted categories |
| US-03 | Create, edit, and delete assignment grades within categories |
| US-04 | Automatically calculate category averages, weighted course averages, letter grades, and cumulative GPA |

The MVP also includes ownership checks, database persistence, validation, empty states, responsive layouts, health/readiness endpoints, and repeatable local setup.

## Deferred scope

The following backlog items are intentionally outside Milestone 1:

- what-if grade simulation (US-05);
- read-only sharing with a parent or advisor (US-06 and US-07);
- custom grade-point scales (US-08);
- CSV or PDF export (US-09); and
- public deployment to Render with Supabase PostgreSQL.

These features remain in the [product backlog](BACKLOG.md). Their absence is a scope decision, not a partially implemented feature.

## Software process

The team uses a lightweight Agile, incremental process organized around small user stories. This model fits a two-person semester project because requirements can be refined after feedback while each completed increment remains demonstrable.

The working cycle is:

1. Select the highest-priority story from the backlog.
2. Confirm its rules, use case, API contract, and data impact.
3. Divide the story into small implementation steps when useful.
4. Implement a vertical slice across database, API, and interface.
5. Build and verify the slice against its acceptance behavior.
6. Update documentation and mark the story Done only when it meets the Definition of Done.

Feature branches and pull requests may be used for reviewable code changes. Documentation-only changes may be committed directly to `main` when the team agrees. The repository history, backlog, ADRs, and verification guide provide the process record.

## Definition of Done

A Milestone 1 story is Done when:

- its documented acceptance behavior works from the user interface through the database;
- authenticated resources are restricted to their owning user;
- validation and failure states are understandable;
- the production build succeeds and existing checks still pass;
- database migrations and configuration changes are committed;
- setup, API, design, or verification documentation is updated when affected; and
- the change is committed with a descriptive message and is ready for teammate review.

## Success criteria

The milestone is ready for submission when a fresh clone can be configured using only committed instructions, all migrations apply to an empty PostgreSQL database, the build and checks pass, and a reviewer can complete the workflow in the [verification guide](verification-guide.md). Accessibility and performance checks are recorded using [quality-checks.md](quality-checks.md).
