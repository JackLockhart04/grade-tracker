# Milestone 1 API Design

## Contract conventions

- Base path: `/api`
- Data format: JSON, except successful delete and logout responses contain no body.
- Authentication: HTTP-only session cookie named `grade_tracker.sid`.
- Authorization: protected routes derive the user from the session and never accept a user ID from the client.
- IDs: UUID strings.
- Dates: ISO 8601 strings in UTC.
- Decimal values: JSON numbers. Grade outputs are rounded to two decimal places.
- Unknown or unowned resources both return `404` to avoid revealing another student's data.

### Common errors

```json
{
  "error": "Human-readable error message."
}
```

| Status | Meaning |
|--------|---------|
| `400` | Invalid or out-of-range request data |
| `401` | Authentication is required or credentials are invalid |
| `404` | Resource does not exist for the signed-in user |
| `409` | Unique value conflicts with existing data |
| `500` | Unexpected server failure |

## Service and readiness routes

| Method | Route | Authentication | Success response |
|--------|-------|----------------|------------------|
| `GET` | `/api` | No | `{ "name": "Grade Tracker API" }` |
| `GET` | `/api/health` | No | `200 { "status": "ok" }` |
| `GET` | `/api/ready` | No | `200 { "status": "ready" }` or `503 { "status": "unavailable" }` |

## Authentication

### Register

`POST /api/auth/register`

```json
{
  "email": "student@example.com",
  "password": "a-strong-password"
}
```

Success: `201`

```json
{
  "user": {
    "id": "64aa6474-ff25-4d2a-b740-7ed48b553680",
    "email": "student@example.com",
    "createdAt": "2026-09-29T14:00:00.000Z"
  }
}
```

The email is trimmed and lowercased. Passwords must contain 12-128 characters. Duplicate emails return `409`.

### Login

`POST /api/auth/login` uses the same request fields and returns `200` with the user object. Any incorrect credential combination returns `401 { "error": "Invalid email or password." }`.

### Current user

`GET /api/auth/me` returns `200` with the user object or `401`.

### Logout

`POST /api/auth/logout` destroys the session and returns `204`.

## Courses

All routes below require authentication.

### List courses and GPA

`GET /api/courses`

```json
{
  "courses": [
    {
      "id": "8cff8f02-9455-47f7-8e56-683d43481ee1",
      "name": "Software Engineering",
      "term": "Fall 2026",
      "creditHours": 3,
      "totalWeight": 0,
      "configurationComplete": false,
      "currentAveragePercentage": null,
      "gradedWeightPercentage": 0,
      "letterGrade": null,
      "gradePoints": null,
      "categories": [],
      "createdAt": "2026-09-29T14:00:00.000Z",
      "updatedAt": "2026-09-29T14:00:00.000Z"
    }
  ],
  "cumulativeGpa": null,
  "gradedCreditHours": 0
}
```

An ungraded course returns `null` for its current average, letter grade, and grade points. If every course is ungraded, `cumulativeGpa` is `null` and `gradedCreditHours` is `0`.

### Create course

`POST /api/courses`

```json
{
  "name": "Software Engineering",
  "term": "Fall 2026",
  "creditHours": 3
}
```

Success: `201 { "course": Course }`.

### Read, update, and delete course

| Method | Route | Request | Success |
|--------|-------|---------|---------|
| `GET` | `/api/courses/:courseId` | None | `200 { "course": Course }` |
| `PATCH` | `/api/courses/:courseId` | Complete `name`, `term`, and `creditHours` values | `200 { "course": Course }` |
| `DELETE` | `/api/courses/:courseId` | None | `204` |

Despite the `PATCH` method, the current update contract requires all three editable course fields. Deleting a course cascades to its categories and assignments.

## Categories

### Category representation inside a course

```json
{
  "id": "935457a4-99ba-441c-b48f-d4d15159927e",
  "courseId": "8cff8f02-9455-47f7-8e56-683d43481ee1",
  "name": "Homework",
  "weightPercentage": 30,
  "assignments": [
    {
      "id": "64857026-4db6-4db7-b0eb-5374cfaf96a2",
      "categoryId": "935457a4-99ba-441c-b48f-d4d15159927e",
      "name": "Homework total",
      "earnedPoints": 80,
      "possiblePoints": 100,
      "createdAt": "2026-09-29T14:00:00.000Z",
      "updatedAt": "2026-09-29T14:00:00.000Z"
    }
  ],
  "earnedPointsTotal": 80,
  "possiblePointsTotal": 100,
  "averagePercentage": 80,
  "effectiveWeightPercentage": 37.5,
  "currentGradeContribution": 30,
  "createdAt": "2026-09-29T14:00:00.000Z",
  "updatedAt": "2026-09-29T14:00:00.000Z"
}
```

Empty categories return `null` for `averagePercentage`, `effectiveWeightPercentage`, and `currentGradeContribution`.

Direct category create/update responses omit `effectiveWeightPercentage` and `currentGradeContribution` because those values require the full course context. Fetching the course returns the complete breakdown.

### Category routes

| Method | Route | Request | Success |
|--------|-------|---------|---------|
| `POST` | `/api/courses/:courseId/categories` | `{ "name": "Homework", "weightPercentage": 30 }` | `201 { "category": Category }` |
| `PATCH` | `/api/categories/:categoryId` | Complete `name` and `weightPercentage` values | `200 { "category": Category }` |
| `DELETE` | `/api/categories/:categoryId` | None | `204` |

The API allows totals below 100% and rejects totals above 100%. Deleting a category cascades to its assignments.

## Assignments

### Assignment representation

```json
{
  "id": "64857026-4db6-4db7-b0eb-5374cfaf96a2",
  "categoryId": "935457a4-99ba-441c-b48f-d4d15159927e",
  "name": "Homework 1",
  "earnedPoints": 8.5,
  "possiblePoints": 10,
  "createdAt": "2026-09-29T14:00:00.000Z",
  "updatedAt": "2026-09-29T14:00:00.000Z"
}
```

### Assignment routes

| Method | Route | Request | Success |
|--------|-------|---------|---------|
| `GET` | `/api/categories/:categoryId/assignments` | None | `200 { "assignments": Assignment[] }` |
| `POST` | `/api/categories/:categoryId/assignments` | `name`, `earnedPoints`, `possiblePoints` | `201 { "assignment": Assignment }` |
| `GET` | `/api/assignments/:assignmentId` | None | `200 { "assignment": Assignment }` |
| `PATCH` | `/api/assignments/:assignmentId` | Complete `name`, `earnedPoints`, and `possiblePoints` values | `200 { "assignment": Assignment }` |
| `DELETE` | `/api/assignments/:assignmentId` | None | `204` |

Earned points must be non-negative, possible points must be positive, and both accept at most two decimal places. Extra credit is represented by earned points greater than possible points.

## Calculation semantics

- Category average: `sum(earnedPoints) / sum(possiblePoints) * 100`.
- Current course average: weighted average over graded categories only.
- `effectiveWeightPercentage`: the category's configured weight normalized among graded categories.
- `currentGradeContribution`: category average multiplied by effective weight.
- GPA: credit-hour-weighted grade points over graded courses only.
- All calculated outputs are read-only and recomputed when courses are requested.
