import { BUILDING_TYPES, PROFESSIONAL_ROLES, PROJECT_PRIORITIES, PROJECT_STATUSES } from "./constants.js";

// Each validate function returns { errors, data }.
//   errors - one message per bad field, for example { name: "Name is required." }
//   data   - the cleaned values, safe to save when "errors" is empty

// Trims text. Empty or non-text values become null.
export function cleanText(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

// A MongoDB id is 24 hex characters.
export function isValidId(id) {
  return typeof id === "string" && /^[a-f0-9]{24}$/i.test(id);
}

// "2026-06-01" is valid, "2026-13-45" is not.
function isRealDate(text) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const date = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+\s()-]{7,20}$/;

export function validateProject(body = {}) {
  const errors = {};

  const project_code = (cleanText(body.project_code) || "").toUpperCase();
  if (!/^[A-Z0-9-]{3,20}$/.test(project_code)) errors.project_code = "Use 3–20 letters, numbers or dashes.";

  const name = cleanText(body.name);
  if (!name || name.length < 3) errors.name = "Project name is required (at least 3 characters).";

  const building_type = cleanText(body.building_type);
  if (!building_type) errors.building_type = "Choose a building type.";
  else if (!BUILDING_TYPES.includes(building_type)) errors.building_type = "Unknown building type.";

  const status = cleanText(body.status) || "Planned";
  if (!PROJECT_STATUSES.includes(status)) errors.status = "Unknown status.";

  const priority = cleanText(body.priority) || "Not recorded";
  if (!PROJECT_PRIORITIES.includes(priority)) errors.priority = "Unknown priority.";

  // Dates arrive as "YYYY-MM-DD" text.
  const dates = {};
  for (const field of ["start_date", "expected_completion_date", "actual_completion_date"]) {
    dates[field] = cleanText(body[field]);
    if (dates[field] && !isRealDate(dates[field])) errors[field] = "Enter a valid date (YYYY-MM-DD).";
  }
  if (!errors.start_date && !errors.expected_completion_date) {
    if (dates.start_date && dates.expected_completion_date && dates.expected_completion_date < dates.start_date) {
      errors.expected_completion_date = "Must be after the start date.";
    }
  }
  if (status === "Completed" && !dates.actual_completion_date) {
    errors.actual_completion_date = "Enter the completion date for a completed project.";
  }

  // Links to other collections.
  const links = {};
  for (const field of ["client", "design_engineer", "draughtsman"]) {
    links[field] = cleanText(body[field]);
    if (links[field] && !isValidId(links[field])) errors[field] = "Invalid selection.";
  }

  const data = {
    project_code,
    name,
    building_type,
    status,
    priority,
    ...links,
    location: cleanText(body.location),
    description: cleanText(body.description),
    project_stage: cleanText(body.project_stage),
    consulting_organization: cleanText(body.consulting_organization),
    project_duration: cleanText(body.project_duration),
    activity_history: cleanText(body.activity_history),
    main_contractor: cleanText(body.main_contractor),
    notes: cleanText(body.notes),
  };
  // Turn the date text into real dates for MongoDB.
  for (const field of Object.keys(dates)) {
    data[field] = dates[field] && !errors[field] ? new Date(`${dates[field]}T00:00:00Z`) : null;
  }
  return { errors, data };
}

export function validateClient(body = {}) {
  const errors = {};
  const data = {
    name: cleanText(body.name),
    company: cleanText(body.company),
    contact_person: cleanText(body.contact_person),
    phone: cleanText(body.phone),
    email: cleanText(body.email),
    address: cleanText(body.address),
    notes: cleanText(body.notes),
  };
  if (!data.name || data.name.length < 2) errors.name = "Client name is required.";
  if (data.email && !EMAIL_PATTERN.test(data.email)) errors.email = "Enter a valid email.";
  if (data.phone && !PHONE_PATTERN.test(data.phone)) errors.phone = "Enter a valid phone number.";
  return { errors, data };
}

export function validateProfessional(body = {}) {
  const errors = {};
  const data = {
    name: cleanText(body.name),
    role: cleanText(body.role),
    organization: cleanText(body.organization),
    phone: cleanText(body.phone),
    email: cleanText(body.email),
    notes: cleanText(body.notes),
  };
  if (!data.name || data.name.length < 2) errors.name = "Name is required.";
  if (!data.role) errors.role = "Professional role is required.";
  else if (!PROFESSIONAL_ROLES.includes(data.role)) errors.role = "Unknown professional role.";
  if (data.email && !EMAIL_PATTERN.test(data.email)) errors.email = "Enter a valid email.";
  if (data.phone && !PHONE_PATTERN.test(data.phone)) errors.phone = "Enter a valid phone number.";
  return { errors, data };
}

const OFFICER_ID_PATTERN = /^[A-Za-z0-9._-]{3,30}$/;

export function validateRegistration(body = {}) {
  const errors = {};
  const full_name = cleanText(body.full_name);
  const officer_id = cleanText(body.officer_id);
  const password = typeof body.password === "string" ? body.password : "";
  if (!full_name || full_name.length < 2) errors.full_name = "Please enter your name.";
  if (!officer_id || !OFFICER_ID_PATTERN.test(officer_id)) errors.officer_id = "Officer ID must be 3–30 letters, numbers, dots or dashes.";
  if (password.length < 6) errors.password = "Password must be at least 6 characters.";
  else if (password.length > 72) errors.password = "Password must be 72 characters or fewer.";
  return { errors, data: { full_name, officer_id, password } };
}

export function validateLogin(body = {}) {
  const errors = {};
  const officer_id = cleanText(body.officer_id);
  const password = typeof body.password === "string" ? body.password : "";
  if (!officer_id) errors.officer_id = "Enter your Officer ID or staff number.";
  if (!password) errors.password = "Enter your password.";
  return { errors, data: { officer_id, password } };
}
