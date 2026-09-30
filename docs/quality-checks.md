# Accessibility and Performance Checks

Use this guide on the final Milestone 1 commit after completing the functional workflow in [verification-guide.md](verification-guide.md). Record the date, browser version, viewport, scores, and any unresolved findings in the final submission evidence. Do not claim a check passed unless it was run against that exact commit.

## Automated browser audit

1. Start PostgreSQL and apply migrations:

   ```bash
   npm run db:start
   npm run db:migrate
   ```

2. Build the application, then start the Express API and the production React build in two terminals:

   ```bash
   npm run build
   npm start
   ```

   ```bash
   npm run preview
   ```

   The Express server only serves `/api`; it does not serve the React build. `npm run preview` serves the compiled client at `http://localhost:4173` and proxies `/api` to Express on port 3000.

3. Open `http://localhost:4173`, sign in, and create the sample data from the verification guide.
4. In Chrome or Edge DevTools, open **Lighthouse**.
5. Select desktop navigation mode and run the Performance, Accessibility, Best Practices, and SEO categories on:
   - the authentication screen;
   - the course dashboard; and
   - a populated course-management screen.
6. Repeat the audit with the mobile device setting for the populated course-management screen.

Authenticated Lighthouse navigation can clear or replace page state depending on the browser version. If an audit returns to the authentication screen, sign in again, navigate to the target screen, and use a DevTools accessibility inspection plus the manual checks below for that screen.

The team should investigate any accessibility failure and any substantial performance regression. Lighthouse scores vary by computer, browser version, and background activity, so record the observed scores instead of treating one number as a permanent guarantee.

## Manual accessibility checks

- Zoom to 200% and confirm content remains readable without overlapping controls.
- At approximately 375 CSS pixels wide, confirm forms and cards stack and the grade table can scroll horizontally.
- Navigate registration, login, course creation, category creation, and assignment creation using only the keyboard.
- Confirm focus is always visible and follows a sensible order.
- Confirm every input has a persistent text label.
- Confirm validation and server errors are announced or exposed with `role="alert"`.
- Confirm headings describe the page structure and table headers identify their data.
- Confirm text and interactive controls remain understandable without relying on color alone.
- Check foreground/background contrast with the browser's accessibility inspector.

## Performance and reliability checks

- Confirm the production page becomes usable on a normal broadband connection without console errors.
- Confirm `GET /api/health` responds with HTTP 200 and `{ "status": "ok" }`.
- Confirm `GET /api/ready` responds with HTTP 200 and `{ "status": "ready" }` while PostgreSQL is healthy.
- Create or edit an assignment and confirm the updated category, course, and GPA values appear without a manual refresh.
- Refresh a populated screen and confirm authentication and persisted data remain available.

## Results record

Recorded by Emanuel Melvin on September 29, 2026, against branch `fix/milestone-1-quality-checks` at commit `8797e99`, using a fresh clone, a new empty database, and the production build served by `npm run preview`. Browser: headless Google Chrome 154 on macOS. Lighthouse 13.5.0. The full HTML reports are in [evidence/lighthouse](evidence/lighthouse/).

The course-management screen has no URL of its own because it is React state, so Lighthouse navigating to it would reload the dashboard. It was audited in Lighthouse snapshot mode after opening the populated Software Engineering course. Snapshot mode does not produce a Performance score.

| Check | Date/browser | Result or score | Notes/follow-up |
|-------|--------------|-----------------|-----------------|
| Desktop authentication audit | 2026-09-29, Chrome 154 | Performance 100, Accessibility 100, Best Practices 96, SEO 100 | FCP 0.3 s, LCP 0.4 s, TBT 0 ms, CLS 0. The Best Practices item is the expected `401` from `GET /api/auth/me` when nobody is signed in. |
| Desktop dashboard audit | 2026-09-29, Chrome 154 | Performance 100, Accessibility 100, Best Practices 96, SEO 100 | FCP 0.2 s, LCP 0.3 s, TBT 0 ms, CLS 0. Same expected `401` console entry. |
| Desktop course-management audit (snapshot) | 2026-09-29, Chrome 154 | Accessibility 100, Best Practices 100, SEO 100 | Populated Software Engineering course. |
| Mobile dashboard audit | 2026-09-29, Chrome 154 | Performance 100, Accessibility 100, Best Practices 100, SEO 100 | FCP 0.9 s, LCP 1.1 s, TBT 0 ms, CLS 0. Repeated 5 times after the layout-shift fix: CLS 0 every run. |
| Mobile course-management audit (snapshot) | 2026-09-29, Chrome 154 | Accessibility 100, Best Practices 100, SEO 100 | Populated Software Engineering course. |
| Keyboard and 200% zoom review | 2026-09-29, Chrome 154 | Pass | Login tab order is Email, Password, Log in, Register link. Keyboard-only login and course creation work. All 13 dashboard tab stops show a focus ring. Every input on the course screen has a label. At 200% zoom (640 CSS px) the course screen has no horizontal page scroll. |
| 375 px responsive review | 2026-09-29, Chrome 154 | Pass | Dashboard and course screen have no horizontal page scroll. The grade table scrolls inside its own wrapper. |

### Findings fixed before recording

The first Lighthouse run, on commit `b2fe827`, found four issues. All four were fixed in commits `3e6e8a4` and `8797e99` and the audits above were rerun afterward.

| Finding | Cause | Fix |
|---------|-------|-----|
| Mobile dashboard CLS 0.322 on some runs (Performance 84) | The Add course panel rendered during loading, then the course list pushed it down | The course grid renders only after courses load |
| Accessibility 98: headings skip a level | The per-category "Assignments" heading was an `h4` directly under an `h2` | Changed to `h3` with the same visual size |
| SEO 91: invalid `robots.txt` | The SPA fallback returned `index.html` for `/robots.txt` | Added `client/public/robots.txt` |
| Console `404` for `/favicon.ico` | No favicon existed | Added `client/public/favicon.svg` |

A small display bug was fixed at the same time: the course card read "80.00%of course weight" with no space.
