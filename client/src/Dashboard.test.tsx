import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Dashboard } from "./Dashboard";

const courseId = "8cff8f02-9455-47f7-8e56-683d43481ee1";
const categoryId = "935457a4-99ba-441c-b48f-d4d15159927e";
const examCategoryId = "a7b0a101-6767-4ff8-9548-461803f74052";

const course = {
  id: courseId,
  name: "Software Engineering",
  term: "Fall 2026",
  creditHours: 3,
  categories: [
    {
      id: categoryId,
      name: "Homework",
      weightPercentage: 30,
      assignments: [
        { id: "assignment-1", name: "Homework 1", earnedPoints: 8, possiblePoints: 10 },
      ],
      earnedPointsTotal: 8,
      possiblePointsTotal: 10,
      averagePercentage: 80,
      effectiveWeightPercentage: 37.5,
      currentGradeContribution: 30,
    },
    {
      id: examCategoryId,
      name: "Exams",
      weightPercentage: 50,
      assignments: [],
      earnedPointsTotal: 0,
      possiblePointsTotal: 0,
      averagePercentage: null,
      effectiveWeightPercentage: null,
      currentGradeContribution: null,
    },
  ],
  totalWeight: 80,
  configurationComplete: false,
  currentAveragePercentage: 80,
  gradedWeightPercentage: 30,
  letterGrade: "B" as const,
  gradePoints: 3,
  updatedAt: "2026-11-02T12:00:00.000Z",
};

const projection = {
  courseAveragePercentage: 90.34,
  letterGrade: "A",
  gradePoints: 4,
  cumulativeGpa: 3.75,
  gradedCreditHours: 4,
};

type MockResponse = Pick<Response, "ok" | "status" | "json">;
type WhatIfResponder = () => MockResponse | Promise<MockResponse>;

function jsonResponse(body: unknown, status = 200): MockResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

async function openCourse(whatIfResponder: WhatIfResponder = () =>
  jsonResponse({ projection })) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, options?: RequestInit) => {
    const path = String(input);
    if (path === "/api/courses" && !options?.method) {
      return jsonResponse({ courses: [course], cumulativeGpa: 3, gradedCreditHours: 3 });
    }
    if (path === `/api/courses/${courseId}` && !options?.method) {
      return jsonResponse({ course });
    }
    if (path === `/api/courses/${courseId}` && options?.method === "PATCH") {
      return jsonResponse({ course });
    }
    if (path === `/api/courses/${courseId}/what-if`) {
      return whatIfResponder();
    }
    throw new Error(`Unexpected request: ${options?.method ?? "GET"} ${path}`);
  });
  vi.stubGlobal("fetch", fetchMock);

  render(
    <Dashboard
      user={{ email: "student@example.com" }}
      onLogout={vi.fn(async () => undefined)}
    />,
  );
  fireEvent.click(await screen.findByRole("button", { name: "Manage" }));
  await screen.findByRole("heading", { name: "What-If calculator" });

  return fetchMock;
}

function enterScore(earnedPoints = "92", possiblePoints = "100") {
  fireEvent.change(screen.getByLabelText("Hypothetical points earned"), {
    target: { value: earnedPoints },
  });
  fireEvent.change(screen.getByLabelText("Hypothetical points possible"), {
    target: { value: possiblePoints },
  });
}

function submitProjection() {
  fireEvent.click(screen.getByRole("button", { name: "Calculate projection" }));
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("What-If calculator", () => {
  it("submits one hypothetical score and displays the returned projection only", async () => {
    const fetchMock = await openCourse();
    enterScore();
    submitProjection();

    expect(await screen.findByText("90.34%")).toBeTruthy();
    expect(screen.getByText("Projected letter grade").parentElement?.textContent).toContain("A");
    expect(screen.getByText("Projected cumulative GPA").parentElement?.textContent).toContain(
      "3.75",
    );

    const whatIfCall = fetchMock.mock.calls.find(
      ([path]) => String(path) === `/api/courses/${courseId}/what-if`,
    );
    expect(whatIfCall).toBeDefined();
    expect(JSON.parse(String(whatIfCall?.[1]?.body))).toEqual({
      categoryId,
      earnedPoints: 92,
      possiblePoints: 100,
    });
    expect(document.querySelectorAll(".assignment-card")).toHaveLength(1);
    expect(screen.getByText("Homework 1")).toBeTruthy();
  });

  it("clears the projection and resets the inputs", async () => {
    await openCourse();
    enterScore();
    submitProjection();
    await screen.findByText("90.34%");

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(screen.queryByText("90.34%")).toBeNull();
    expect((screen.getByLabelText("Hypothetical points earned") as HTMLInputElement).value).toBe(
      "",
    );
    expect(
      (screen.getByLabelText("Hypothetical points possible") as HTMLInputElement).value,
    ).toBe("");
    expect((screen.getByLabelText("Category") as HTMLSelectElement).value).toBe(categoryId);
  });

  it.each([
    ["Category", examCategoryId],
    ["Hypothetical points earned", "93"],
    ["Hypothetical points possible", "101"],
  ])("changing %s clears an existing projection", async (label, value) => {
    await openCourse();
    enterScore();
    submitProjection();
    await screen.findByText("90.34%");

    fireEvent.change(screen.getByLabelText(label), { target: { value } });

    expect(screen.queryByText("90.34%")).toBeNull();
  });

  it.each([
    ["Category", examCategoryId],
    ["Hypothetical points earned", "93"],
    ["Hypothetical points possible", "101"],
  ])("changing %s invalidates an in-flight request", async (label, value) => {
    const pending = deferred<MockResponse>();
    await openCourse(() => pending.promise);
    enterScore();
    submitProjection();

    fireEvent.change(screen.getByLabelText(label), { target: { value } });
    await act(async () => {
      pending.resolve(jsonResponse({ projection }));
      await pending.promise;
    });

    expect(screen.queryByText("90.34%")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows accessible loading state until the latest request completes", async () => {
    const pending = deferred<MockResponse>();
    await openCourse(() => pending.promise);
    enterScore();
    submitProjection();

    const loadingButton = screen.getByRole("button", { name: "Calculating..." });
    expect((loadingButton as HTMLButtonElement).disabled).toBe(true);

    await act(async () => {
      pending.resolve(jsonResponse({ projection }));
      await pending.promise;
    });
    expect(await screen.findByText("90.34%")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Calculate projection" }) as HTMLButtonElement).disabled)
      .toBe(false);
  });

  it.each([
    ["server validation", () => jsonResponse({ error: "Points are invalid." }, 400), "Points are invalid."],
    ["network failure", () => Promise.reject(new Error("Network unavailable.")), "Network unavailable."],
  ])("displays a %s error", async (_name, responder, message) => {
    await openCourse(responder);
    enterScore();
    submitProjection();

    expect(await screen.findByRole("alert")).toHaveProperty("textContent", message);
  });

  it("displays an unauthenticated response", async () => {
    await openCourse(() => jsonResponse({ error: "Authentication required." }, 401));
    enterScore();
    submitProjection();

    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "Authentication required.",
    );
  });

  it("does not restore a stale projection or error after Clear", async () => {
    const pending = deferred<MockResponse>();
    await openCourse(() => pending.promise);
    enterScore();
    submitProjection();
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));

    await act(async () => {
      pending.resolve(jsonResponse({ error: "Obsolete failure." }, 400));
      await pending.promise;
    });

    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByText("90.34%")).toBeNull();
    expect(screen.getByRole("button", { name: "Calculate projection" })).toBeTruthy();
  });

  it("clears the projection when saved course data changes", async () => {
    await openCourse();
    enterScore();
    submitProjection();
    await screen.findByText("90.34%");

    fireEvent.click(screen.getByRole("button", { name: "Save course" }));

    await waitFor(() => expect(screen.queryByText("90.34%")).toBeNull());
  });

  it("cannot restore an old result after leaving the selected course", async () => {
    const pending = deferred<MockResponse>();
    await openCourse(() => pending.promise);
    enterScore();
    submitProjection();
    fireEvent.click(screen.getByRole("button", { name: "← Back to courses" }));

    await act(async () => {
      pending.resolve(jsonResponse({ projection }));
      await pending.promise;
    });

    expect(screen.queryByRole("heading", { name: "What-If calculator" })).toBeNull();
    expect(screen.queryByText("90.34%")).toBeNull();
  });

  it("keeps the newer result when requests complete out of order", async () => {
    const first = deferred<MockResponse>();
    const second = deferred<MockResponse>();
    let requestCount = 0;
    await openCourse(() => {
      requestCount += 1;
      return requestCount === 1 ? first.promise : second.promise;
    });

    enterScore("80", "100");
    submitProjection();
    fireEvent.change(screen.getByLabelText("Hypothetical points earned"), {
      target: { value: "95" },
    });
    submitProjection();

    const newerProjection = { ...projection, courseAveragePercentage: 95 };
    await act(async () => {
      second.resolve(jsonResponse({ projection: newerProjection }));
      await second.promise;
    });
    expect(await screen.findByText("95.00%")).toBeTruthy();

    await act(async () => {
      first.resolve(
        jsonResponse({ projection: { ...projection, courseAveragePercentage: 70 } }),
      );
      await first.promise;
    });
    expect(screen.getByText("95.00%")).toBeTruthy();
    expect(screen.queryByText("70.00%")).toBeNull();
  });

  it("does not let an older request clear loading for a newer request", async () => {
    const first = deferred<MockResponse>();
    const second = deferred<MockResponse>();
    let requestCount = 0;
    await openCourse(() => {
      requestCount += 1;
      return requestCount === 1 ? first.promise : second.promise;
    });

    enterScore("80", "100");
    submitProjection();
    fireEvent.change(screen.getByLabelText("Hypothetical points earned"), {
      target: { value: "95" },
    });
    submitProjection();

    await act(async () => {
      first.resolve(jsonResponse({ projection }));
      await first.promise;
    });
    expect(screen.getByRole("button", { name: "Calculating..." })).toBeTruthy();

    await act(async () => {
      second.resolve(jsonResponse({ projection }));
      await second.promise;
    });
    expect(await screen.findByText("90.34%")).toBeTruthy();
  });
});
