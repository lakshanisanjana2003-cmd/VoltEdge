import { describe, expect, it } from "vitest";
import { nextProjectCode, summarizeProjects, validateProject } from "./projectHelpers";

const validForm = {
  project_code: "EP-2026-010", name: "Test Building", building_type: "Office",
  start_date: "2026-01-01", expected_completion_date: "2026-06-01", actual_completion_date: "", status: "Planned",
};

describe("validateProject", () => {
  it("accepts a valid project", () => expect(validateProject(validForm)).toEqual({}));
  it("requires a project ID", () => expect(validateProject({ ...validForm, project_code: "" })).toHaveProperty("project_code"));
  it("rejects completion before start", () =>
    expect(validateProject({ ...validForm, expected_completion_date: "2025-12-01" })).toHaveProperty("expected_completion_date"));
  it("needs an actual completion date when Completed", () =>
    expect(validateProject({ ...validForm, status: "Completed" })).toHaveProperty("actual_completion_date"));
});

describe("nextProjectCode", () => {
  it("continues from the highest number", () => expect(nextProjectCode(["P001", "P002", "P003"])).toBe("P004"));
  it("starts at P001", () => expect(nextProjectCode([])).toBe("P001"));
  it("skips deleted numbers", () => expect(nextProjectCode(["P001", "P007"])).toBe("P008"));
  it("ignores other code styles", () => expect(nextProjectCode(["EP-2026-009"])).toBe("P001"));
  it("grows past three digits", () => expect(nextProjectCode(["P99"])).toBe("P100"));
});

describe("summarizeProjects", () => {
  const projects = [
    { status: "Ongoing", expected_completion_date: "2027-10-17T00:00:00.000Z" },
    { status: "Ongoing", expected_completion_date: "2027-04-17T00:00:00.000Z" },
    { status: "Planned", expected_completion_date: "2027-10-17T00:00:00.000Z" },
    { status: "Ongoing", expected_completion_date: "2026-09-01T00:00:00.000Z" },
  ];
  it("counts totals by status", () => {
    const summary = summarizeProjects(projects, "2026-10-19");
    expect(summary.total).toBe(4);
    expect(summary.ongoing).toBe(3);
    expect(summary.planned).toBe(1);
    expect(summary.completed).toBe(0);
  });
  it("finds overdue projects", () => expect(summarizeProjects(projects, "2026-10-19").overdue).toHaveLength(1));
  it("only lists deadlines inside the next 60 days", () => {
    expect(summarizeProjects(projects, "2026-10-19").upcoming).toEqual([]);
    expect(summarizeProjects(projects, "2027-03-01").upcoming).toHaveLength(1);
  });
  it("ignores completed projects", () =>
    expect(summarizeProjects([{ status: "Completed", expected_completion_date: "2020-01-01" }], "2026-10-19").overdue).toEqual([]));
});
