# Milestone 1 Use Cases

These use cases cover the working MVP stories US-01 through US-04. The primary actor is a student. What-if simulation and guest access are reserved for Milestone 2.

## UC-01: Register, sign in, and sign out

**Related story:** US-01  
**Goal:** Access a private grade dashboard through a secure session.  
**Preconditions:** The application and PostgreSQL are available.

### Registration flow

1. The student opens the application and chooses registration.
2. The student enters a valid email and a password containing 12 to 128 characters.
3. The client submits the credentials to `POST /api/auth/register`.
4. The server normalizes the email, verifies that it is unused, hashes the password with Argon2id, and creates the user.
5. The server regenerates and saves a PostgreSQL-backed session.
6. The client displays the student's empty course dashboard.

### Returning-user flow

1. The student enters an email and password.
2. The client submits them to `POST /api/auth/login`.
3. The server verifies the password hash and creates a new authenticated session.
4. The client displays the student's saved courses and GPA summary.

### Alternative and failure flows

- Invalid registration input returns `400` with a safe validation message.
- A duplicate email returns `409`.
- Incorrect login credentials return one generic `401` message that does not reveal which credential was wrong.
- `GET /api/auth/me` restores an existing valid browser session after a refresh.
- Signing out destroys the server-side session and clears the cookie.

### Postconditions

- A successful request leaves the browser authenticated as exactly one student.
- Password text is never stored in the database.
- Unauthenticated users cannot access course, category, or assignment routes.

## UC-02: Configure courses and weighted categories

**Related story:** US-02  
**Goal:** Model one course and its grading-category weights.  
**Preconditions:** The student is authenticated.

### Main flow

1. The student opens the dashboard and enters a course name, term, and credit hours.
2. The client sends `POST /api/courses`.
3. The server associates the course with the authenticated user.
4. The student opens the course and adds categories such as Homework and Exams.
5. Each category is saved with a percentage weight.
6. The course view displays the configured total and whether it equals 100%.
7. The student may edit or delete their course and categories.

### Rules and alternatives

- Credit hours must be between 0.5 and 30.
- A course may be saved while category weights total less than 100%.
- A category change that would make the total exceed 100% is rejected.
- Category names must be unique within the course.
- Deleting a course deletes its categories and assignments; deleting a category deletes its assignments.
- Ownership checks return `404` when another student attempts to access the resource.

### Postconditions

- The course structure persists across sessions.
- The category configuration is available to grade calculations.

## UC-03: Record and maintain assignment grades

**Related story:** US-03  
**Goal:** Record earned and possible points under the correct category.  
**Preconditions:** The authenticated student owns a course containing at least one category.

### Main flow

1. The student opens a course and locates a category.
2. The student enters an assignment name, earned points, and possible points.
3. The client sends `POST /api/categories/:categoryId/assignments`.
4. The server validates the score and verifies category ownership.
5. The assignment is stored and displayed beneath the category.
6. The student may edit or delete the assignment.
7. The client refreshes the course after every change.

### Rules and alternatives

- Names are required and limited to 150 characters.
- Earned points must be zero or greater.
- Possible points must be greater than zero.
- Points use no more than two decimal places.
- Earned points may exceed possible points to represent extra credit.
- Invalid input returns `400`; resources owned by another student appear as `404`.

### Postconditions

- Valid changes persist in PostgreSQL.
- The refreshed course response contains updated category and course calculations.

## UC-04: Review current averages and cumulative GPA

**Related story:** US-04  
**Goal:** Understand current academic standing immediately after grade changes.  
**Preconditions:** The student is authenticated; at least one assignment is required for a calculated grade.

### Main flow

1. The dashboard requests `GET /api/courses`.
2. The server calculates category averages from earned and possible points.
3. It calculates each course's current weighted average, letter grade, and grade points.
4. It calculates cumulative GPA weighted by graded course credit hours.
5. The dashboard displays GPA, course grades, and “No grade yet” for ungraded courses.
6. The student opens a course to view the category contribution breakdown.
7. Adding, editing, or deleting an assignment repeats the calculation and updates the screen.

### Calculation and display rules

- Empty categories are excluded from the current average rather than counted as zero.
- Graded category weights are normalized to 100% for the current average.
- An incomplete category configuration is visibly identified.
- Extra credit may produce an average above 100%, while grade points remain capped at 4.0.
- Ungraded courses are excluded from cumulative GPA.
- The interface labels the result as a current grade, not a guaranteed final grade.

### Postconditions

- Calculated values are returned without creating additional stored grade records.
- The contribution rows sum to the displayed current course average, subject to two-decimal rounding.
