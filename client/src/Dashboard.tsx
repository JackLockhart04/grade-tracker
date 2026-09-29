import { useEffect, useState, type FormEvent } from "react";

type User = {
  email: string;
};

type Category = {
  id: string;
  name: string;
  weightPercentage: number;
};

type Course = {
  id: string;
  name: string;
  term: string;
  creditHours: number;
  categories: Category[];
  totalWeight: number;
  configurationComplete: boolean;
  updatedAt: string;
};

type ApiResponse = {
  course?: Course;
  courses?: Course[];
  category?: Category;
  error?: string;
};

async function apiRequest(path: string, options?: RequestInit): Promise<ApiResponse> {
  const response = await fetch(path, options);
  const body = response.status === 204 ? {} : ((await response.json()) as ApiResponse);

  if (!response.ok) {
    throw new Error(body.error ?? "The request failed.");
  }

  return body;
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
    if (!window.confirm(`Delete the ${category.name} category?`)) {
      return;
    }

    try {
      await apiRequest(`/api/categories/${category.id}`, { method: "DELETE" });
      await onChanged();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to delete category.");
    }
  }

  return (
    <div className="category-row">
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadCourses() {
    const body = await apiRequest("/api/courses");
    setCourses(body.courses ?? []);
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
    if (!window.confirm(`Delete ${course.name} and all of its categories?`)) {
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
                    <h3>{course.name}</h3>
                    <p>{course.term} · {course.creditHours} credit hours</p>
                    <p>{course.totalWeight}% configured</p>
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
      )}

      {error && <p className="error" role="alert">{error}</p>}
    </main>
  );
}
