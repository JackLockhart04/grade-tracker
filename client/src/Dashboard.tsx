import { useEffect, useState, type FormEvent } from "react";

type User = {
  email: string;
};

type Assignment = {
  id: string;
  name: string;
  earnedPoints: number;
  possiblePoints: number;
};

type Category = {
  id: string;
  name: string;
  weightPercentage: number;
  assignments: Assignment[];
  earnedPointsTotal: number;
  possiblePointsTotal: number;
  averagePercentage: number | null;
};

type Course = {
  id: string;
  name: string;
  term: string;
  creditHours: number;
  categories: Category[];
  totalWeight: number;
  configurationComplete: boolean;
  currentAveragePercentage: number | null;
  gradedWeightPercentage: number;
  letterGrade: "A" | "B" | "C" | "D" | "F" | null;
  gradePoints: number | null;
  updatedAt: string;
};

type ApiResponse = {
  course?: Course;
  courses?: Course[];
  category?: Category;
  assignment?: Assignment;
  cumulativeGpa?: number | null;
  gradedCreditHours?: number;
  error?: string;
};

function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

async function apiRequest(path: string, options?: RequestInit): Promise<ApiResponse> {
  const response = await fetch(path, options);
  const body = response.status === 204 ? {} : ((await response.json()) as ApiResponse);

  if (!response.ok) {
    throw new Error(body.error ?? "The request failed.");
  }

  return body;
}

function AssignmentRow({
  assignment,
  onChanged,
}: {
  assignment: Assignment;
  onChanged: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(assignment.name);
  const [earnedPoints, setEarnedPoints] = useState(String(assignment.earnedPoints));
  const [possiblePoints, setPossiblePoints] = useState(String(assignment.possiblePoints));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setName(assignment.name);
    setEarnedPoints(String(assignment.earnedPoints));
    setPossiblePoints(String(assignment.possiblePoints));
  }, [assignment.name, assignment.earnedPoints, assignment.possiblePoints]);

  function cancelEditing() {
    setName(assignment.name);
    setEarnedPoints(String(assignment.earnedPoints));
    setPossiblePoints(String(assignment.possiblePoints));
    setError("");
    setEditing(false);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setError("");
      setSaving(true);
      await apiRequest(`/api/assignments/${assignment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          earnedPoints: Number(earnedPoints),
          possiblePoints: Number(possiblePoints),
        }),
      });
      await onChanged();
      setEditing(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save assignment.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete “${assignment.name}”? This cannot be undone.`)) {
      return;
    }

    try {
      setError("");
      setDeleting(true);
      await apiRequest(`/api/assignments/${assignment.id}`, { method: "DELETE" });
      await onChanged();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to delete assignment.");
      setDeleting(false);
    }
  }

  if (editing) {
    return (
      <article className="assignment-card">
        <form className="assignment-edit-form" onSubmit={save}>
          <label>
            Assignment name
            <input
              value={name}
              maxLength={150}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>
          <label>
            Points earned
            <input
              type="number"
              min="0"
              max="99999999.99"
              step="0.01"
              value={earnedPoints}
              onChange={(event) => setEarnedPoints(event.target.value)}
              required
            />
          </label>
          <label>
            Points possible
            <input
              type="number"
              min="0.01"
              max="99999999.99"
              step="0.01"
              value={possiblePoints}
              onChange={(event) => setPossiblePoints(event.target.value)}
              required
            />
          </label>
          <div className="row-actions">
            <button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
            <button type="button" className="secondary-button" onClick={cancelEditing} disabled={saving}>
              Cancel
            </button>
          </div>
          {error && <p className="error" role="alert">{error}</p>}
        </form>
      </article>
    );
  }

  return (
    <article className="assignment-card">
      <div className="assignment-card-main">
        <span>{assignment.name}</span>
        <strong>{assignment.earnedPoints} / {assignment.possiblePoints} points</strong>
      </div>
      <div className="row-actions assignment-actions">
        <button type="button" onClick={() => setEditing(true)}>Edit</button>
        <button type="button" className="danger-button" onClick={remove} disabled={deleting}>
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
    </article>
  );
}

function CategoryRow({
  category,
  onChanged,
}: {
  category: Category;
  onChanged: () => Promise<void>;
}) {
  const [name, setName] = useState(category.name);
  const [weight, setWeight] = useState(String(category.weightPercentage));
  const [error, setError] = useState("");
  const [assignmentError, setAssignmentError] = useState("");
  const [addingAssignment, setAddingAssignment] = useState(false);

  async function save() {
    try {
      setError("");
      await apiRequest(`/api/categories/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, weightPercentage: Number(weight) }),
      });
      await onChanged();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save category.");
    }
  }

  async function remove() {
    if (!window.confirm(`Delete the ${category.name} category and all of its assignments?`)) {
      return;
    }

    try {
      await apiRequest(`/api/categories/${category.id}`, { method: "DELETE" });
      await onChanged();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to delete category.");
    }
  }

  async function addAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      setAssignmentError("");
      setAddingAssignment(true);
      await apiRequest(`/api/categories/${category.id}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("assignmentName"),
          earnedPoints: Number(data.get("earnedPoints")),
          possiblePoints: Number(data.get("possiblePoints")),
        }),
      });
      form.reset();
      await onChanged();
    } catch (requestError) {
      setAssignmentError(
        requestError instanceof Error ? requestError.message : "Unable to add assignment.",
      );
    } finally {
      setAddingAssignment(false);
    }
  }

  return (
    <div className="category-row">
      <div className="category-editor">
        <label>
          Category name
          <input value={name} maxLength={100} onChange={(event) => setName(event.target.value)} />
        </label>
        <label>
          Weight (%)
          <input
            type="number"
            min="0.01"
            max="100"
            step="0.01"
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
          />
        </label>
        <div className="row-actions">
          <button type="button" onClick={save}>Save</button>
          <button type="button" className="danger-button" onClick={remove}>Delete</button>
        </div>
        {error && <p className="error" role="alert">{error}</p>}
      </div>

      <div className="category-grade-summary">
        {category.averagePercentage === null ? (
          <strong>No grade yet</strong>
        ) : (
          <>
            <strong>Current average: {formatPercentage(category.averagePercentage)}</strong>
            <span>
              {category.earnedPointsTotal} / {category.possiblePointsTotal} points
            </span>
          </>
        )}
      </div>

      <section className="assignment-section" aria-labelledby={`assignments-${category.id}`}>
        <h4 id={`assignments-${category.id}`}>Assignments</h4>
        {category.assignments.length === 0 ? (
          <p className="muted">No assignments in this category yet.</p>
        ) : (
          <div className="assignment-list">
            {category.assignments.map((assignment) => (
              <AssignmentRow key={assignment.id} assignment={assignment} onChanged={onChanged} />
            ))}
          </div>
        )}

        <form
          className="assignment-form"
          aria-describedby={`assignment-help-${category.id}`}
          onSubmit={addAssignment}
        >
          <label>
            Assignment name
            <input name="assignmentName" maxLength={150} required />
          </label>
          <label>
            Points earned
            <input
              name="earnedPoints"
              type="number"
              min="0"
              max="99999999.99"
              step="0.01"
              required
            />
          </label>
          <label>
            Points possible
            <input
              name="possiblePoints"
              type="number"
              min="0.01"
              max="99999999.99"
              step="0.01"
              required
            />
          </label>
          <button type="submit" disabled={addingAssignment}>
            {addingAssignment ? "Adding..." : "Add assignment"}
          </button>
        </form>
        <p className="field-help" id={`assignment-help-${category.id}`}>
          Use up to two decimal places. Earned points may exceed possible points for extra credit.
        </p>
        {assignmentError && <p className="error" role="alert">{assignmentError}</p>}
      </section>
    </div>
  );
}

function CourseDetail({
  course,
  onBack,
  onChanged,
}: {
  course: Course;
  onBack: () => void;
  onChanged: () => Promise<void>;
}) {
  const [name, setName] = useState(course.name);
  const [term, setTerm] = useState(course.term);
  const [creditHours, setCreditHours] = useState(String(course.creditHours));
  const [error, setError] = useState("");

  async function updateCourse(event: FormEvent) {
    event.preventDefault();
    try {
      setError("");
      await apiRequest(`/api/courses/${course.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, term, creditHours: Number(creditHours) }),
      });
      await onChanged();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update course.");
    }
  }

  async function addCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      setError("");
      await apiRequest(`/api/courses/${course.id}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("categoryName"),
          weightPercentage: Number(data.get("weightPercentage")),
        }),
      });
      form.reset();
      await onChanged();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to add category.");
    }
  }

  return (
    <section className="dashboard-panel">
      <button type="button" className="link-button" onClick={onBack}>← Back to courses</button>
      <h2>Manage course</h2>
      <form className="form-grid" onSubmit={updateCourse}>
        <label>
          Course name
          <input value={name} maxLength={150} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label>
          Term
          <input value={term} maxLength={100} onChange={(event) => setTerm(event.target.value)} required />
        </label>
        <label>
          Credit hours
          <input
            type="number"
            min="0.5"
            max="30"
            step="0.5"
            value={creditHours}
            onChange={(event) => setCreditHours(event.target.value)}
            required
          />
        </label>
        <button type="submit">Save course</button>
      </form>

      <div className={`weight-summary ${course.configurationComplete ? "complete" : "incomplete"}`}>
        Category weight total: <strong>{course.totalWeight}%</strong>
        {!course.configurationComplete && " — configuration is incomplete"}
      </div>

      <div className="course-grade-summary">
        {course.currentAveragePercentage === null ? (
          <>
            <span className="grade-value">No grade yet</span>
            <p className="muted">Add an assignment grade to calculate the current average.</p>
          </>
        ) : (
          <>
            <div>
              <span className="grade-value">{formatPercentage(course.currentAveragePercentage)}</span>
              <span className="letter-grade" aria-label={`Letter grade ${course.letterGrade}`}>
                {course.letterGrade}
              </span>
            </div>
            <p className="muted">
              Based on categories representing {formatPercentage(course.gradedWeightPercentage)} of
              the course weight. Categories without graded assignments are not included.
            </p>
          </>
        )}
      </div>

      <h2>Categories</h2>
      {course.categories.length === 0 ? (
        <p className="muted">No categories yet. Add the first one below.</p>
      ) : (
        <div className="category-list">
          {course.categories.map((category) => (
            <CategoryRow key={category.id} category={category} onChanged={onChanged} />
          ))}
        </div>
      )}

      <form className="form-grid add-category" onSubmit={addCategory}>
        <h3>Add category</h3>
        <label>
          Category name
          <input name="categoryName" maxLength={100} required />
        </label>
        <label>
          Weight (%)
          <input name="weightPercentage" type="number" min="0.01" max="100" step="0.01" required />
        </label>
        <button type="submit">Add category</button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  );
}

export function Dashboard({ user, onLogout }: { user: User; onLogout: () => Promise<void> }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course>();
  const [cumulativeGpa, setCumulativeGpa] = useState<number | null>(null);
  const [gradedCreditHours, setGradedCreditHours] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadCourses() {
    const body = await apiRequest("/api/courses");
    setCourses(body.courses ?? []);
    setCumulativeGpa(body.cumulativeGpa ?? null);
    setGradedCreditHours(body.gradedCreditHours ?? 0);
  }

  async function refreshSelectedCourse() {
    if (!selectedCourse) {
      await loadCourses();
      return;
    }

    const body = await apiRequest(`/api/courses/${selectedCourse.id}`);
    setSelectedCourse(body.course);
    await loadCourses();
  }

  useEffect(() => {
    loadCourses()
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "Unable to load courses.");
      })
      .finally(() => setLoading(false));
  }, []);

  async function addCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      setError("");
      await apiRequest("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("courseName"),
          term: data.get("term"),
          creditHours: Number(data.get("creditHours")),
        }),
      });
      form.reset();
      await loadCourses();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to add course.");
    }
  }

  async function openCourse(courseId: string) {
    try {
      const body = await apiRequest(`/api/courses/${courseId}`);
      setSelectedCourse(body.course);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load course.");
    }
  }

  async function deleteCourse(course: Course) {
    if (!window.confirm(`Delete ${course.name}, its categories, and all assignments?`)) {
      return;
    }

    try {
      await apiRequest(`/api/courses/${course.id}`, { method: "DELETE" });
      await loadCourses();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to delete course.");
    }
  }

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Grade Tracker</p>
          <h1>Courses</h1>
          <p className="muted">Signed in as {user.email}</p>
        </div>
        <button type="button" onClick={onLogout}>Log out</button>
      </header>

      {selectedCourse ? (
        <CourseDetail
          key={`${selectedCourse.id}-${selectedCourse.updatedAt}`}
          course={selectedCourse}
          onBack={() => setSelectedCourse(undefined)}
          onChanged={refreshSelectedCourse}
        />
      ) : (
        <>
          <section className="gpa-summary" aria-label="Cumulative GPA">
            <div>
              <p className="eyebrow">Cumulative GPA</p>
              <p className="gpa-value">
                {loading ? "—" : cumulativeGpa === null ? "No GPA yet" : cumulativeGpa.toFixed(2)}
              </p>
            </div>
            <p className="muted">
              {gradedCreditHours > 0
                ? `Based on ${gradedCreditHours} graded credit hours.`
                : "Courses without grades are not included."}
            </p>
          </section>

          <div className="dashboard-grid">
            <section className="dashboard-panel">
              <h2>Your courses</h2>
              {loading ? (
                <p>Loading courses...</p>
              ) : courses.length === 0 ? (
                <p className="muted">You have not added any courses yet.</p>
              ) : (
                <div className="course-list">
                  {courses.map((course) => (
                    <article className="course-card" key={course.id}>
                      <div className="course-card-heading">
                        <h3>{course.name}</h3>
                        {course.currentAveragePercentage === null ? (
                          <span className="grade-badge empty">No grade yet</span>
                        ) : (
                          <span className="grade-badge">
                            {formatPercentage(course.currentAveragePercentage)} · {course.letterGrade}
                          </span>
                        )}
                      </div>
                      <p>{course.term} · {course.creditHours} credit hours</p>
                      <p>{course.totalWeight}% configured</p>
                      {course.currentAveragePercentage !== null && (
                        <p className="field-help">
                          Based on categories representing {formatPercentage(course.gradedWeightPercentage)}
                          of course weight.
                        </p>
                      )}
                      <div className="row-actions">
                        <button type="button" onClick={() => openCourse(course.id)}>Manage</button>
                        <button type="button" className="danger-button" onClick={() => deleteCourse(course)}>Delete</button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="dashboard-panel">
              <h2>Add course</h2>
              <form className="form-grid" onSubmit={addCourse}>
                <label>
                  Course name
                  <input name="courseName" maxLength={150} required />
                </label>
                <label>
                  Term
                  <input name="term" maxLength={100} placeholder="Fall 2026" required />
                </label>
                <label>
                  Credit hours
                  <input name="creditHours" type="number" min="0.5" max="30" step="0.5" required />
                </label>
                <button type="submit">Add course</button>
              </form>
            </section>
          </div>
        </>
      )}

      {error && <p className="error" role="alert">{error}</p>}
    </main>
  );
}
