// Fixed option lists used forms, filters.
export const PROJECT_STATUSES = ["Planned", "Ongoing", "On Hold", "Completed"];
export const PROJECT_PRIORITIES = ["Not recorded", "Low", "Medium", "High", "Urgent"];
export const BUILDING_TYPES = [
  "Government / Educational / Office Building",
  "Commercial / Other",
  "Government / Institutional / Court Building",
  "Residential",
  "Commercial",
  "Office",
  "Hospital",
  "Educational",
  "Industrial",
  "Hotel",
  "Mixed Use",
  "Other",
];
export const PROFESSIONAL_ROLES = [
  "Electrical Engineer",
  "Client Representative",
  "Electrical Design Engineer",
  "Draughtsman",
  "Consultant",
  "Contractor",
  "Site Engineer",
  "Inspector",
  "Other",
];




export const DOCUMENT_TYPES = ["Tender Drawing", "Construction Drawing", "Shop Drawing", "As built Drawing", "Other"];
export const DRAWING_STATUSES = ["Draft", "Issued for review", "Approved", "Superseded"];
export const VISIT_STATUSES = ["Scheduled", "Completed", "Cancelled"];
export const TEST_RESULTS = ["Pending", "Pass", "Fail"];



// Columns form boxes for professionals used by Professionals page , "My profile"
export const PROFESSIONAL_FIELDS = [
  {
    name: "professional_id", label: "Professional ID", required: true, showInTable: true, placeholder: "e.g. PR-001",
    pattern: /^[A-Za-z0-9-]{3,20}$/, patternMessage: "Use 3–20 letters, numbers or dashes, for example PR-001.",
  },
  { name: "name", label: "Name", required: true, showInTable: true },
  { name: "role", label: "Professional role", type: "select", options: PROFESSIONAL_ROLES, required: true, showInTable: true },
  { name: "organization", label: "Organization", showInTable: true },
  { name: "qualifications", label: "Qualifications", type: "textarea" },
  { name: "phone", label: "Phone", type: "tel", showInTable: true },
  { name: "email", label: "Email", type: "email", showInTable: true },
  { name: "notes", label: "Notes", type: "textarea" },
];