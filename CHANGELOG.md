# Changelog

All notable changes to Grade Tracker are documented here. This project follows a simplified [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) structure.

## [Unreleased] - Milestone 2

### Added

- Milestone 2 scope, Definition of Done, workflow conventions, and final coverage targets.
- Testable acceptance criteria for What-If and the planned revocable secret-link sharing stories.
- V8 coverage commands for the client and server workspaces.
- An authenticated, non-persistent What-If calculator for projecting one assignment's effect on a course grade and cumulative GPA.
- Calculation and What-If route tests covering grade boundaries, weighting, rounding, validation, authorization, and non-persistence.
- Per-IP rate limiting on login and registration (10 attempts per 15 minutes by default, configurable with `AUTH_RATE_LIMIT_MAX` and `AUTH_RATE_LIMIT_WINDOW_MS`) returning `429` with standard `RateLimit-*` headers.
- Helmet security headers on every API response.
- Auth rate-limit and security-header tests, a `scripts/security-evidence.mjs` check script, and recorded before-and-after evidence under `docs/evidence/milestone-2/`.
- A threat model, OWASP Top 10 review, and verification steps in `docs/security.md`.

Read-only guest sharing remains planned Milestone 2 work.

## [milestone-1] - 2026-09-29

### Added

- React, Express, TypeScript, npm-workspace, Docker PostgreSQL, and Prisma application foundation.
- Secure student registration, login, persistent PostgreSQL sessions, and logout.
- Course, weighted-category, and assignment management with ownership enforcement and validation.
- Weighted course averages, letter grades, and credit-hour-weighted cumulative GPA.
- Responsive user interface, demonstration seed data, setup and verification guides, design records, and recorded quality checks.
- Health and database-readiness smoke tests.

## [milestone-0] - 2026-09-02

### Added

- Initial project definition, team and user scope, prioritized backlog, Definition of Done, and development plan.
- Initial architecture diagram and repository documentation for the proposed React, Express, and SQL application.

[Unreleased]: https://github.com/JackLockhart04/grade-tracker/compare/milestone-1...HEAD
[milestone-1]: https://github.com/JackLockhart04/grade-tracker/releases/tag/milestone-1
[milestone-0]: https://github.com/JackLockhart04/grade-tracker/releases/tag/milestone-0
