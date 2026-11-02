# Milestone 2 Development Overview

## Objective and deliverables

Milestone 2 builds on the working Milestone 1 application by completing additional features, increasing automated verification, and documenting and improving security. The final milestone submission must remain runnable and include:

- completed Milestone 2 features and a working demonstration;
- unit and main-flow integration tests, a coverage report, and justified coverage targets;
- a quality-assurance checklist plus cross-viewport or cross-platform evidence;
- peer code-review evidence;
- a threat model, review of relevant OWASP Top 10 categories, at least one implemented security control, and before-and-after evidence for the security change;
- updated setup, environment, migration, seed, test-account, verification, and contribution documentation;
- documented branching and commit conventions, this changelog, and the required final `milestone-2` tag.

## Planned scope

- US-05: non-persisted What-If course-grade and GPA projections.
- US-06: student-controlled creation, copying, and revocation of read-only secret links using cryptographically random tokens stored only as hashes; guests do not need accounts.
- US-07: an authorized, read-only guest academic summary.
- Automated unit and integration testing, coverage measurement, and QA evidence.
- Security analysis, an implemented and testable control, and before-and-after evidence.
- Updated reproducibility and verification instructions for a fresh clone.

These items are planned work, not claims about the current baseline.

## Definition of Done

Milestone 2 work is Done when:

- its acceptance criteria work through the relevant interface, API, and persistence boundary;
- authorization, validation, failure states, and security-relevant behavior have automated tests where practical;
- `npm test`, `npm run test:coverage`, and `npm run build` pass;
- affected setup, environment, migration, seed, API, design, QA, and verification documentation is current;
- the change is committed on a feature branch with an approved prefix and merged through a teammate-reviewed pull request;
- review, test, coverage, QA, and security evidence needed for the final report is retained; and
- the repository remains reproducible from a fresh clone.

## Branch, commit, and review conventions

Continue developing on short-lived feature branches rather than directly on `main`. Each change is merged through a pull request reviewed and approved by the other teammate. Use these commit prefixes:

- `feat:` for a new user-facing capability;
- `fix:` for a defect correction;
- `test:` for test-only changes;
- `docs:` for documentation-only changes; and
- `chore:` for maintenance that does not change product behavior.

Retain pull-request links, review approvals, and relevant review discussion so the final Milestone 2 report can show peer-review evidence.

## Coverage targets

By the final Milestone 2 release, automated tests should reach:

- at least 70% line coverage in both the client and server application code; and
- at least 90% line coverage for `server/src/grades/calculations.ts`.

The higher calculation-module target is justified because incorrect weighted grades or GPA results are a high-impact project risk, and the pure calculation service can be tested deterministically. These are final Milestone 2 targets, not claims about the current baseline, and they are not enforced yet while the planned tests are still being added.

Coverage evaluation includes all client and server source files, including files not yet exercised by a test, so untested code remains visible in the baseline. Generated Prisma code, build output, test files, configuration-only files, and TypeScript declaration files are excluded so they do not distort the application-code target.
