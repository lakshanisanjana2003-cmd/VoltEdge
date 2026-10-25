// Fixed option lists used by forms and filters.
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

// Pages that are not built yet. They only show a "not built yet" notice.
export const PLANNED_PAGES = [
  {
    path: "/drawings",
    title: "Drawings and Documents",
    items: ["Drawing number and title", "Category and type", "Revision and issue date", "Prepared / checked / approved by", "Status and comments", "File attachments (PDF, DWG, DXF…)"],
  },
  {
    path: "/site-visits",
    title: "Site Visits",
    items: ["Visit date and time", "Attending professionals", "Observations", "Photos and documents", "Corrective actions", "Follow-up status"],
  },
  {
    path: "/tenders",
    title: "Tender and Bidding",
    items: ["Tender reference and title", "Submission deadline", "Bidders", "Quoted amounts", "Evaluation notes"],
  },
  {
    path: "/material-approvals",
    title: "Material Approvals",
    items: ["Material description", "Manufacturer and model", "Datasheet", "Reviewed by", "Approval status"],
  },
  {
    path: "/testing",
    title: "Testing and Certification",
    items: ["Test type and date", "Inspector", "Results", "Defects and actions", "Certificates"],
  },
  {
    path: "/payments",
    title: "Payments",
    items: ["Payee", "Application reference", "Amount claimed / certified / paid", "Payment status"],
  },
];
