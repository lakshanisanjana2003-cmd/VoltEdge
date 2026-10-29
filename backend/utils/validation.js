import {
  BUILDING_TYPES, DOCUMENT_TYPES, DRAWING_STATUSES, PROFESSIONAL_ROLES, PROJECT_PRIORITIES,
  PROJECT_STATUSES, TEST_RESULTS, VISIT_STATUSES,
} from "./constants.js";

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

// "2026-06-01" is valid
function isRealDate(text) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const date = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+\s()-]{7,20}$/;
const BUSINESS_ID_PATTERN = /^[A-Z0-9-]{3,20}$/;

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

  // Links other collections.
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
  // Turn into real dates.
  for (const field of Object.keys(dates)) {
    data[field] = dates[field] && !errors[field] ? new Date(`${dates[field]}T00:00:00Z`) : null;
  }
  return { errors, data };
}

export function validateClient(body = {}) {
  const errors = {};
  const data = {
    client_id: cleanText(body.client_id)?.toUpperCase() ?? null,
    name: cleanText(body.name),
    company: cleanText(body.company),
    contact_person: cleanText(body.contact_person),
    phone: cleanText(body.phone),
    email: cleanText(body.email),
    address: cleanText(body.address),
    notes: cleanText(body.notes),
  };
  if (!data.name || data.name.length < 2) errors.name = "Client name is required.";
  if (data.client_id && !BUSINESS_ID_PATTERN.test(data.client_id)) {
  errors.client_id = "Use 3–20 letters, numbers or dashes, for example CL-001.";
}
  if (data.email && !EMAIL_PATTERN.test(data.email)) errors.email = "Enter a valid email.";
  if (data.phone && !PHONE_PATTERN.test(data.phone)) errors.phone = "Enter a valid phone number.";
  return { errors, data };
}

export function validateProfessional(body = {}) {
  const errors = {};
  const data = {
    professional_id: cleanText(body.professional_id)?.toUpperCase() ?? null,
    name: cleanText(body.name),
    role: cleanText(body.role),
    organization: cleanText(body.organization),
    qualifications: cleanText(body.qualifications),
    phone: cleanText(body.phone),
    email: cleanText(body.email),
    notes: cleanText(body.notes),
  };
  if (!data.name || data.name.length < 2) errors.name = "Name is required.";
  if (data.professional_id && !BUSINESS_ID_PATTERN.test(data.professional_id)) {
  errors.professional_id = "Use 3–20 letters, numbers or dashes, for example PR-001.";
}
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


function readLink(body, field, errors, required) {
  const value = cleanText(body[field]);
  if (!value) {
    if (required) errors[field] = "Please choose one.";
    return null;
  }
  if (!isValidId(value)) {
    errors[field] = "Invalid selection.";
    return null;
  }
  return value;
}

// Reads a date 
function readDate(body, field, errors, required) {
  const value = cleanText(body[field]);
  if (!value) {
    if (required) errors[field] = "Enter a date.";
    return null;
  }
  if (!isRealDate(value)) {
    errors[field] = "Enter a valid date (YYYY-MM-DD).";
    return null;
  }
  return new Date(`${value}T00:00:00Z`);
}

export function validateSiteVisit(body = {}) {
  const errors = {};
  const data = {
    project: readLink(body, "project", errors, true),
    visit_date: readDate(body, "visit_date", errors, true),
    visited_by: readLink(body, "visited_by", errors, false),
    purpose: cleanText(body.purpose),
    inspection_notes: cleanText(body.inspection_notes),
    follow_up_actions: cleanText(body.follow_up_actions),
    status: cleanText(body.status) || "Scheduled",
  };
  if (!VISIT_STATUSES.includes(data.status)) errors.status = "Unknown status.";
  return { errors, data };
}

export function validateTestRecord(body = {}) {
  const errors = {};
  const test_type = cleanText(body.test_type);
  if (!test_type || test_type.length < 3) errors.test_type = "Test type is required (for example Insulation resistance).";
  const result = cleanText(body.result) || "Pending";
  if (!TEST_RESULTS.includes(result)) errors.result = "Unknown result.";
  const data = {
    project: readLink(body, "project", errors, true),
    test_type,
    test_date: readDate(body, "test_date", errors, true),
    tested_by: readLink(body, "tested_by", errors, false),
    result,
    measurements: cleanText(body.measurements),
    remarks: cleanText(body.remarks),
    certificate_number: cleanText(body.certificate_number),
    certificate_date: readDate(body, "certificate_date", errors, false),
  };
  return { errors, data };
}

export function validateDrawing(body = {}) {
  const errors = {};
  const drawing_number = (cleanText(body.drawing_number) || "").toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9./-]{2,29}$/.test(drawing_number)) {
    errors.drawing_number = "Use 3–30 letters, numbers, dots, slashes or dashes.";
  }
  const title = cleanText(body.title);
  if (!title || title.length < 3) errors.title = "Title is required (at least 3 characters).";
  const document_type = cleanText(body.document_type) || "Drawing";
  if (!DOCUMENT_TYPES.includes(document_type)) errors.document_type = "Unknown type.";
  const status = cleanText(body.status) || "Draft";
  if (!DRAWING_STATUSES.includes(status)) errors.status = "Unknown status.";
  const data = {
    project: readLink(body, "project", errors, true),
    drawing_number,
    title,
    document_type,
    status,
    notes: cleanText(body.notes),
  };
  return { errors, data };
}

export function validateRevision(body = {}) {
  const errors = {};
  const revision = (cleanText(body.revision) || "").toUpperCase();
  if (!/^[A-Z0-9-]{1,10}$/.test(revision)) errors.revision = "Use 1–10 letters, numbers or dashes, for example A or 01.";
  const revision_date = readDate(body, "revision_date", errors, true);
  return { errors, data: { revision, revision_date, description: cleanText(body.description) } };
}