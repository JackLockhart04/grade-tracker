# Accessibility and Performance Checks

Use this guide on the final Milestone 1 commit after completing the functional workflow in [verification-guide.md](verification-guide.md). Record the date, browser version, viewport, scores, and any unresolved findings in the final submission evidence. Do not claim a check passed unless it was run against that exact commit.

## Automated browser audit

1. Start PostgreSQL and apply migrations:

   ```bash
   npm run db:start
   npm run db:migrate
   ```

2. Build and start the production application:

   ```bash
   npm run build
   npm start
   ```

3. Open `http://localhost:3000`, sign in, and create the sample data from the verification guide.
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

Copy this table into the final submission evidence after running the checks:

| Check | Date/browser | Result or score | Notes/follow-up |
|-------|--------------|-----------------|-----------------|
| Desktop authentication audit | Not run | Pending | Run on final commit |
| Desktop dashboard audit | Not run | Pending | Run on final commit |
| Desktop course-management audit | Not run | Pending | Run on final commit |
| Mobile course-management audit | Not run | Pending | Run on final commit |
| Keyboard and 200% zoom review | Not run | Pending | Run on final commit |
| 375 px responsive review | Not run | Pending | Run on final commit |

The checked-in template deliberately says `Not run` until a team member performs the audit. Replace these entries with real observations before submission.
