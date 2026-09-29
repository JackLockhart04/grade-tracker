import { useEffect, useState, type FormEvent } from "react";
import { Dashboard } from "./Dashboard";

type User = {
  id: string;
  email: string;
  createdAt: string;
};

type AuthResponse = {
  user?: User;
  error?: string;
};

function App() {
  const [user, setUser] = useState<User>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");

  useEffect(() => {
    async function restoreSession() {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const body = (await response.json()) as AuthResponse;
          setUser(body.user);
        }
      } finally {
        setLoading(false);
      }
    }

    void restoreSession();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setSubmitting(true);
    setError("");

    try {
      const form = new FormData(formElement);
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      const body = (await response.json()) as AuthResponse;

      if (response.ok && body.user) {
        setUser(body.user);
        formElement.reset();
      } else {
        setError(body.error ?? "Authentication failed.");
      }
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) {
        setUser(undefined);
        setError("");
      }
    } catch {
      setError("Unable to reach the server. Please try again.");
    }
  }

  if (loading) {
    return <main className="app-shell">Loading...</main>;
  }

  if (user) {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  return (
    <main className="app-shell">
      <section className="card">
        <p className="eyebrow">CS 415</p>
        <h1>Grade Tracker</h1>

        <>
            <h2>{mode === "login" ? "Log in" : "Create an account"}</h2>
            <form onSubmit={handleSubmit}>
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" autoComplete="email" required />

              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                minLength={mode === "register" ? 12 : undefined}
                required
              />
              {mode === "register" && (
                <p className="field-help">Use at least 12 characters.</p>
              )}

              {error && <p className="error" role="alert">{error}</p>}

              <button type="submit" disabled={submitting}>
                {submitting
                  ? "Please wait..."
                  : mode === "login"
                    ? "Log in"
                    : "Create account"}
              </button>
            </form>

            <button
              className="link-button"
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
              }}
            >
              {mode === "login"
                ? "Need an account? Register"
                : "Already have an account? Log in"}
            </button>
        </>
      </section>
    </main>
  );
}

export default App;
