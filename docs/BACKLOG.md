# Product Backlog

## Backlog Items

| ID | User Story | Priority | Points | Status | Notes |
|----|------------|----------|--------|--------|-------|
| US-01 | As a student, I want to create an account and log in securely... | High | 3 | Done | Argon2id passwords and PostgreSQL sessions |
| US-02 | As a student, I want to create courses and assign category weights... | High | 5 | Done | Allows incomplete totals; rejects totals over 100% |
| US-03 | As a student, I want to enter assignment grades with earned and total points... | High | 5 | Done | Assignment CRUD by weighted category; extra credit supported |
| US-04 | As a student, I want automated calculation of class averages and cumulative GPA... | High | 5 | Done | Weighted current averages; credit-hour GPA on standard 4.0 scale |
| US-05 | As a student, I want to use a "what-if" calculator for hypothetical grades... | High | 5 | Done | One in-memory hypothetical assignment; projected course grade and GPA |
| US-06 | As a student, I want to share read-only access with an advisor/parent... | Medium | 3 | Backlog | Revocable secret link with a hashed random token |
| US-07 | As a guest viewer, I want to view a student's GPA and course averages... | Medium | 3 | Backlog | Read-only enforcement |
| US-08 | As a student, I want custom grade point scales per course (capped at 4.0)... | Low | 3 | Backlog | Candidate for Milestone 2 |
| US-09 | As a student, I want to export my term summary to CSV or PDF... | Low | 2 | Backlog | Candidate for Milestone 3 |

## Acceptance Criteria for Milestone 2 Stories

### US-05: What-If Calculator

- Given a student with saved courses and grades, when they enter or change hypothetical assignment scores, then the projected course grade and cumulative GPA update using those scores.
- Given a student using hypothetical scores, when they leave or reset the What-If tool, then no hypothetical assignment or score has been saved and their persisted grades remain unchanged.

### US-06: Student Sharing

- Given an authenticated student, when they create read-only sharing, then the application provides a secret access link they can copy without requiring the guest to create an account.
- Given an active sharing link, when the student revokes it, then the link no longer grants access to the student's academic summary.
- Given a sharing link is stored, then the database contains only a hash of its cryptographically random token rather than the usable token itself.

### US-07: Guest Viewing

- Given a guest with an active authorized sharing link, when they open it, then they can view only the shared student's academic summary, including cumulative GPA and course averages.
- Given a guest view, when the guest attempts to create, edit, or delete academic data or access another student's data, then the application denies the action and no data changes.
