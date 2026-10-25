// Small functions about projects. They do not use React, so they are easy to test.

// Dates from MongoDB look like "2026-06-01T00:00:00.000Z". We only need "2026-06-01".
export function onlyDate(value) {
  return value ? value.slice(0, 10) : "";
}

// Projects are numbered P001, P002 ... This finds the next free number.
export function nextProjectCode(codes) {
  const numbers = [];
  for (const code of codes) {
    const match = /^P0*(\d+)$/i.exec(code.trim());
    if (match) numbers.push(Number(match[1]));
  }
  const highest = numbers.length > 0 ? Math.max(...numbers) : 0;
  return "P" + String(highest + 1).padStart(3, "0");
}

// Checks the project form. Returns an object like { name: "message" }; empty means no problems.
export function validateProject(values) {
  const errors = {};
  if (!/^[A-Za-z0-9-]{3,20}$/.test(values.project_code.trim())) {
    errors.project_code = "Use 3–20 letters, numbers or dashes.";
  }
  if (values.name.trim().length < 3) errors.name = "Project name is required.";
  if (!values.building_type) errors.building_type = "Choose a building type.";
  if (values.start_date && values.expected_completion_date && values.expected_completion_date < values.start_date) {
    errors.expected_completion_date = "Must be after the start date.";
  }
  if (values.status === "Completed" && !values.actual_completion_date) {
    errors.actual_completion_date = "Enter the completion date for a completed project.";
  }
  return errors;
}

// Numbers for the dashboard. "today" is a text date like "2026-10-25".
export function summarizeProjects(projects, today) {
  // The deadline window is the next 60 days.
  const limit = new Date(`${today}T00:00:00Z`);
  limit.setUTCDate(limit.getUTCDate() + 60);
  const windowEnd = limit.toISOString().slice(0, 10);

  const notCompleted = projects.filter((p) => p.status !== "Completed");
  const upcoming = notCompleted
    .filter((p) => {
      const deadline = onlyDate(p.expected_completion_date);
      return deadline && deadline >= today && deadline <= windowEnd;
    })
    .sort((a, b) => onlyDate(a.expected_completion_date).localeCompare(onlyDate(b.expected_completion_date)));
  const overdue = notCompleted.filter((p) => {
    const deadline = onlyDate(p.expected_completion_date);
    return deadline && deadline < today;
  });

  return {
    total: projects.length,
    ongoing: projects.filter((p) => p.status === "Ongoing").length,
    planned: projects.filter((p) => p.status === "Planned").length,
    completed: projects.filter((p) => p.status === "Completed").length,
    upcoming,
    overdue,
  };
}
