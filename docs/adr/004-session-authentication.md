# ADR-004: Use server-side session authentication with secure cookies

- **Status:** Accepted
- **Date:** 2026-09-28
- **Owners:** Jack Lockhart and Emanuel Melvin

## Context

Grade Tracker stores private academic information and requires student registration, login, persistent sessions, and strict ownership checks. The frontend needs a safe way to identify the current user without storing reusable credentials or authentication tokens in browser-accessible storage.

The application will be served from one origin in production, so it does not require a stateless token architecture for communication across independent services.

## Decision

Grade Tracker will use email-and-password authentication backed by server-side sessions.

- Passwords will be hashed with Argon2id and never stored or logged in plain text.
- `express-session` will manage session identifiers.
- Session records will be stored in PostgreSQL; the default in-memory store will not be used outside isolated tests.
- The browser cookie will contain only the opaque session identifier.
- The cookie will be `HttpOnly`, `SameSite=Lax`, and `Secure` in production.
- The session identifier will be regenerated after successful login and invalidated during logout.
- Login failures will use a generic error that does not reveal whether an email exists.
- Every protected API operation will verify authentication and resource ownership on the server.
- Express will trust the Render proxy in production so secure cookies work behind managed HTTPS.
- Secrets and cookie configuration will be supplied through environment variables.

## Rationale

Server-side sessions fit a browser-based application served from one origin. They allow sessions to be revoked immediately and keep authentication data out of browser JavaScript. PostgreSQL session storage also allows sessions to survive application restarts and avoids relying on a single server process.

Argon2id is designed for password storage and is recommended for new applications by OWASP.

## Consequences

### Positive

- Authentication tokens are unavailable to ordinary frontend JavaScript.
- Logout and session expiration can invalidate access on the server.
- Authorization decisions remain centralized in Express.
- No JWT refresh-token system is required.

### Negative

- Each authenticated request requires session-store access.
- Cookie and reverse-proxy settings differ between local HTTP and deployed HTTPS.
- Cross-origin deployment would require additional CORS, cookie, and CSRF design; therefore, the client and API should remain on one origin.
- Expired session records require periodic cleanup.

## Alternatives considered

- **JWT stored in local storage:** Avoids a session table but exposes tokens to browser JavaScript and complicates revocation and refresh behavior.
- **JWT stored in an HTTP-only cookie:** Viable, but provides little benefit over server-side sessions for this application and adds token lifecycle complexity.
- **Supabase Auth:** Provides a managed authentication system, but would move core account behavior outside the Express backend described in the project architecture.

## References

- [Express session middleware](https://expressjs.com/en/resources/middleware/session.html)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
