# Milestone 1 Responsive Wireframes

These are low-fidelity wireframes for the implemented interface. They identify information hierarchy and responsive behavior rather than exact colors or typography.

## Screen 1: Authentication

### Desktop and tablet

```text
+------------------------------------------------------------------+
|                                                                  |
|                  +----------------------------+                  |
|                  | GRADE TRACKER              |                  |
|                  | Track courses and GPA      |                  |
|                  |                            |                  |
|                  | [ Sign in ] [ Register ]   |                  |
|                  | Email                      |                  |
|                  | [________________________] |                  |
|                  | Password                   |                  |
|                  | [________________________] |                  |
|                  | [ Continue               ] |                  |
|                  | Error or password guidance |                  |
|                  +----------------------------+                  |
|                                                                  |
+------------------------------------------------------------------+
```

### Phone

```text
+--------------------------+
| GRADE TRACKER            |
| Track courses and GPA    |
|                          |
| [ Sign in ] [ Register ] |
| Email                    |
| [______________________] |
| Password                 |
| [______________________] |
| [ Continue             ] |
| Guidance / error         |
+--------------------------+
```

The form remains a single column at every width. Labels stay visible above their fields, keyboard focus is visible, and errors appear next to the form rather than only through color.

## Screen 2: Course dashboard

### Desktop and tablet

```text
+--------------------------------------------------------------------------+
| GRADE TRACKER / Courses          signed in as student      [ Log out ]    |
+--------------------------------------------------------------------------+
| CUMULATIVE GPA   3.25                Based on 4 graded credit hours       |
+--------------------------------------------------------------------------+
| YOUR COURSES                                  | ADD COURSE                |
| +-------------------------------------------+ | Course name               |
| | Software Engineering     86.25% - B       | | [_______________________] |
| | Fall 2026 - 3 credit hours               | | Term                      |
| | 100% configured / 80% currently graded   | | [_______________________] |
| | [ Manage ] [ Delete ]                    | | Credit hours              |
| +-------------------------------------------+ | [_______________________] |
| +-------------------------------------------+ | [ Add course             ] |
| | Ungraded Course          No grade yet     | +---------------------------+
| | Fall 2026 - 4 credit hours               |
| | [ Manage ] [ Delete ]                    |
| +-------------------------------------------+
+--------------------------------------------------------------------------+
```

### Phone

```text
+----------------------------+
| GRADE TRACKER              |
| Courses                    |
| signed in as student       |
| [ Log out ]                |
+----------------------------+
| CUMULATIVE GPA             |
| 3.25                       |
| Based on 4 graded credits  |
+----------------------------+
| YOUR COURSES               |
| +------------------------+ |
| | Software Engineering   | |
| | 86.25% - B             | |
| | Fall 2026 / 3 credits  | |
| | [Manage] [Delete]      | |
| +------------------------+ |
+----------------------------+
| ADD COURSE                 |
| [ fields stack vertically] |
| [ Add course             ] |
+----------------------------+
```

The two desktop columns collapse to one column below 48rem. Grade badges move below headings when horizontal space is limited.

## Screen 3: Course and grade management

### Desktop and tablet

```text
+--------------------------------------------------------------------------+
| <- Back to courses                                                       |
| MANAGE COURSE                                                            |
| [ Course name ] [ Term ] [ Credit hours ] [ Save course ]                |
| Category weight total: 100%                                              |
|                                                                          |
| CURRENT GRADE       86.25%                                      [ B ]     |
| Based on categories representing 80% of course weight                    |
|                                                                          |
| CURRENT GRADE BREAKDOWN                                                  |
| Category   Average   Course wt.   Current share   Contribution            |
| Homework    80.00%      30.00%        37.50%          30.00 pts           |
| Exams       90.00%      50.00%        62.50%          56.25 pts           |
| Projects   No grade     20.00%           -                -               |
|                                            Current average: 86.25%        |
|                                                                          |
| CATEGORIES                                                               |
| +----------------------------------------------------------------------+ |
| | Homework / 30%                            Current average: 80.00%      | |
| | [ Save category ] [ Delete category ]                              | |
| | Assignments                                                          | |
| | Homework 1                                 8 / 10 points              | |
| | [ Edit ] [ Delete ]                                                | |
| | [ Name ] [ Earned ] [ Possible ] [ Add assignment ]                  | |
| +----------------------------------------------------------------------+ |
|                                                                          |
| ADD CATEGORY                                                             |
| [ Category name ] [ Weight ] [ Add category ]                            |
+--------------------------------------------------------------------------+
```

### Phone

```text
+------------------------------+
| <- Back to courses           |
| MANAGE COURSE                |
| [fields stack vertically]    |
| [ Save course              ] |
+------------------------------+
| CURRENT GRADE                |
| 86.25%                   B   |
| Based on 80% graded weight   |
+------------------------------+
| GRADE BREAKDOWN              |
| [horizontally scrollable     |
|  calculation table]          |
+------------------------------+
| HOMEWORK / 30%               |
| Average: 80.00%              |
| Homework 1                   |
| 8 / 10 points                |
| [Edit] [Delete]              |
| [assignment fields stack]    |
| [ Add assignment           ] |
+------------------------------+
```

The calculation table scrolls horizontally instead of shrinking text below a readable size. Assignment cards and forms become vertical. Destructive actions remain labeled and require confirmation.

## Navigation and state notes

- Authentication success moves to the course dashboard.
- “Manage” replaces the dashboard list with one selected course; “Back to courses” restores the list.
- Mutations show disabled loading buttons and retain nearby error messages on failure.
- Empty courses and categories show explanatory text instead of blank containers.
- What-if and guest screens are intentionally absent from the Milestone 1 wireframes.
