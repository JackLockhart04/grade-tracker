# Security Review and Controls

This document records the Milestone 2 security work for Grade Tracker: a short threat model, a pass over the OWASP Top 10 (2021) against the current code, and the two controls implemented in this milestone with instructions for verifying them. File paths are relative to the repository root.

## 1. Threat model

### Assets

- Student account credentials (email and Argon2id password hash in the `users` table).
- Session identifiers (the `grade_tracker.sid` cookie and the server-side `sessions` rows).
- Each student's courses, categories, and assignment grades. Grade data is private to its owner; a second student must never be able to read or change it.
- The secret-link tokens planned for US-06 guest sharing (stored only as hashes when implemented).
- Server configuration secrets: `SESSION_SECRET` and `DATABASE_URL` in the untracked `.env` file.

### Trust boundaries and actors

```text
Browser (React, untrusted input)  --HTTP/JSON-->  Express API (trusted code, validates everything)  --Prisma/pg-->  PostgreSQL (trusted, local or Supabase)
```

- The browser is outside the trust boundary. Everything that arrives at the API (JSON bodies, route parameters, cookies, headers) is treated as attacker-controlled.
- The Express API is the only component that talks to the database. It owns authentication, authorization, and validation.
- PostgreSQL is trusted but is reached only through Prisma with parameterized queries.

Actors:

- **Student** - a registered user who should only see their own data.
- **Anonymous visitor** - anyone who can reach the API without logging in, including an attacker guessing passwords.
- **Another student** - an authenticated user who tries to reach records they do not own.
- **Guest with a secret link** (planned US-06/US-07) - reads one shared summary and nothing else.

### Threats and mitigations

| Threat | Where it applies | Mitigation (existing or new in M2) |
|--------|------------------|------------------------------------|
| Credential stuffing / password brute force | `POST /api/auth/login`, `POST /api/auth/register` | Existing: Argon2id hashing, generic "Invalid email or password." response, 12-128 character passwords. **New in M2:** per-IP rate limit of 10 attempts per 15 minutes on both routes (`server/src/auth/rate-limit.ts`). |
| Session fixation | login and registration | Existing: `request.session.regenerate()` before the user id is stored (`server/src/auth/router.ts`), so a pre-login session id is never promoted. |
| Session theft through the cookie | all authenticated routes | Existing: `httpOnly`, `sameSite: "lax"`, `secure` in production, 7-day rolling expiry, session rows stored in PostgreSQL (`server/src/auth/session.ts`). |
| IDOR on courses, categories, and assignments | `/api/courses/*`, `/api/categories/*`, `/api/assignments/*` | Existing: every query filters by `response.locals.userId` taken from the session (`server/src/courses/router.ts`, `server/src/assignments/router.ts`); a record owned by another user returns the same generic 404 as a missing record. |
| SQL injection | every database call | Existing: Prisma builds parameterized queries; the code never concatenates SQL strings. |
| Malformed or oversized JSON | every route with a body | Existing: `express.json()` default 100 kB limit and a generic 400 for malformed JSON (`server/src/app.ts`). |
| Clickjacking, MIME sniffing, leaky referrers | every API response | **New in M2:** `helmet()` sends `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, a restrictive `Content-Security-Policy`, and related headers (`server/src/app.ts`). |
| Secret-link token leakage (planned US-06) | guest summary routes | Planned: tokens generated with `crypto.randomBytes`, stored only as hashes, revocable by the owner, and the guest route is read-only. The `Referrer-Policy: no-referrer` header added in M2 also stops a shared URL from leaking through the referrer when a guest follows an outbound link. |
| Secrets committed to the repository | `.env` | Existing: `.env` is git-ignored and `.env.example` holds placeholders; production refuses to start without `SESSION_SECRET` and `DATABASE_URL` (`server/src/config/environment.ts`). |

## 2. OWASP Top 10 (2021) review

| Category | Relevant? | Current state in this codebase | Action taken in M2 |
|----------|-----------|--------------------------------|--------------------|
| A01 Broken Access Control | Yes | `requireAuthentication` guards all course and assignment routes (`server/src/auth/require-authentication.ts`); each query is scoped by the session user id in `server/src/courses/router.ts` and `server/src/assignments/router.ts`. Route tests confirm a 401 without a session. | No change needed; the What-If route tests added by Jack cover the 401 and ownership cases. |
| A02 Cryptographic Failures | Yes | Passwords hashed with Argon2id (`server/src/auth/router.ts`); session secret required in production; cookies marked secure in production. | Added `Strict-Transport-Security` through helmet for deployed HTTPS use. |
| A03 Injection | Yes | All queries go through Prisma with parameters; request bodies are type-checked before use (`parseCredentials`, the course and assignment validators). | No change needed. |
| A04 Insecure Design | Yes | Generic error messages, ownership-scoped queries, and a non-persistent What-If calculator keep the design simple. Brute-force protection was missing. | Added the login/registration rate limit. |
| A05 Security Misconfiguration | Yes | `x-powered-by` was already disabled, but no other security headers were sent (see `docs/evidence/milestone-2/30-headers-before.txt`). | Added `helmet()` as the first middleware with its default header set. |
| A06 Vulnerable and Outdated Components | Yes | Dependencies are pinned through `package-lock.json`; install scripts are restricted by the `allowScripts` policy. | New packages pinned to exact versions (`express-rate-limit` 8.7.2, `helmet` 8.3.0). `npm audit` should be run before the final tag. |
| A07 Identification and Authentication Failures | Yes | Argon2id, session regeneration on login, 12-128 character passwords, generic invalid-credential message. No limit on repeated attempts. | Added the per-IP attempt limit with a 429 response and `RateLimit-*` headers. |
| A08 Software and Data Integrity Failures | Partly | Lockfile and `allowScripts` control what runs during install. No CI pipeline yet. | No change. |
| A09 Security Logging and Monitoring Failures | Partly | Unexpected errors are logged with `console.error`; failed logins are not logged. | No change; noted as future work. |
| A10 Server-Side Request Forgery | No | The server makes no outbound HTTP requests based on user input. | Not applicable. |

## 3. Implemented controls

### 3.1 Login and registration rate limiting

- Package: `express-rate-limit` 8.7.2 (exact version in `server/package.json`).
- Code: `server/src/auth/rate-limit.ts` exports `createAuthRateLimiter()`. `server/src/auth/router.ts` places one limiter in front of `POST /api/auth/register` and another in front of `POST /api/auth/login`, so each route has its own counter. Logout and `GET /api/auth/me` are not limited.
- Defaults: 10 requests per client IP per 15-minute window. Every request to the route counts, successful or not, which keeps the control simple. Counts are kept in memory and reset when the server restarts.
- Response when the limit is exceeded: HTTP `429` with body `{ "error": "Too many attempts. Try again later." }`, a `Retry-After` header, and the standard `RateLimit-Limit`, `RateLimit-Remaining`, and `RateLimit-Reset` headers. Legacy `X-RateLimit-*` headers are disabled.
- Configuration (`server/src/config/environment.ts`, documented in `.env.example`):

| Variable | Default | Meaning |
|----------|---------|---------|
| `AUTH_RATE_LIMIT_MAX` | `10` | Attempts allowed per IP per window |
| `AUTH_RATE_LIMIT_WINDOW_MS` | `900000` | Window length in milliseconds (15 minutes) |

Both must be positive integers; the server refuses to start otherwise.

### 3.2 HTTP security headers

- Package: `helmet` 8.3.0.
- Code: `app.use(helmet())` is the first middleware in `createApp()` (`server/src/app.ts`), so every response, including errors, carries the headers.
- Headers added (full list in `docs/evidence/milestone-2/31-headers-after.txt`): `Content-Security-Policy`, `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy: same-origin`, `Referrer-Policy: no-referrer`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and a few smaller ones.
- Why the defaults were kept: the Express server only returns JSON, so the content-security policy does not restrict anything the client needs. In development the React app calls the API through the Vite proxy (`client/vite.config.ts`), so the browser sees the API responses as same-origin and `Cross-Origin-Resource-Policy: same-origin` does not block them. Browsers ignore `Strict-Transport-Security` over plain HTTP, so it has no effect on `http://localhost` and only matters once the API is served over HTTPS.

## 4. How to verify

### Automated tests

```bash
npm test --workspace server
```

- `server/src/auth/router.test.ts` sends ten wrong-password logins (all `401`, `RateLimit-Remaining` counting down from 9 to 0), checks that the eleventh returns `429` with the JSON body, checks that registration has its own separate budget, and checks that logout and `/api/auth/me` are not limited. Prisma is mocked, so no database is needed.
- `server/src/app.test.ts` checks that `GET /api/health` carries `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, a `Content-Security-Policy`, and `Referrer-Policy: no-referrer`.

### Manual check with the evidence script

With the normal stack running (`npm run db:start` then `npm run dev`):

```bash
node scripts/security-evidence.mjs http://localhost:3000
curl -i http://localhost:3000/api/health
```

The first command prints twelve attempts: ten `401` rows with `RateLimit-Remaining` counting down, then two `429` rows. The second shows the helmet headers.

Without a database, `node scripts/security-evidence-server.mjs 3100` starts the same Express app in-process with the Prisma client stubbed (every lookup finds no user), and the two commands above work against `http://127.0.0.1:3100`. The browser-based login form is not affected by the stub; it is only a way to exercise the API.

To confirm the configuration is read, start the server with `AUTH_RATE_LIMIT_MAX=1000` and rerun the script: all twelve attempts return `401` and `RateLimit-Remaining` starts at 999.

### Before-and-after evidence

Captured on 2026-11-02 and committed under `docs/evidence/milestone-2/`:

| File | What it shows |
|------|---------------|
| `20-login-before.txt` | Commit `1462d83` (before this change): twelve wrong-password logins, all `401`, no rate-limit headers. |
| `21-login-after.txt` | This branch with defaults: attempts 1-10 return `401` with `RateLimit-Remaining` 9 down to 0; attempts 11-12 return `429`. |
| `22-login-limiter-disabled.txt` | This branch with `AUTH_RATE_LIMIT_MAX=1000`: all twelve return `401`, confirming the environment variable is honored. |
| `30-headers-before.txt` | `GET /api/health` before: only `Content-Type`, `Content-Length`, `ETag`, `Date`, and connection headers. |
| `31-headers-after.txt` | `GET /api/health` after: the helmet header set listed above. |
| `00-tests-before.txt`, `10-tests-after.txt` | `npm test` output before (44 server tests) and after (48 server tests). |
| `11-coverage-after.txt`, `12-build.txt` | Server coverage table and the production build after the change. |

The machine used for the capture had no Docker or PostgreSQL, so the API was started with `scripts/security-evidence-server.mjs` (Prisma stubbed, in-memory session store). The limiter and the headers do not touch the database, so the behavior is the same against the real stack.

## 5. Limitations and future work

- The rate limit is per IP and in memory. Users behind one shared network address share a budget, and a restart clears the counters. A per-account lockout or a shared store (for example Redis) would be needed for a multi-instance deployment.
- `trust proxy` is only enabled in production, so behind a reverse proxy in development every client would appear as the proxy's IP.
- Failed logins are not logged, so there is no monitoring of attack attempts (A09).
- The planned secret-link feature (US-06/US-07) must follow the token handling described in the threat model when it is implemented.
