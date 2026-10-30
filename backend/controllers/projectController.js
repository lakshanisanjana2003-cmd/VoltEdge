import Client from "../models/Client.js";
import Professional from "../models/Professional.js";
import Project from "../models/Project.js";
import { isValidId, validateProject } from "../utils/validation.js";
import Drawing from "../models/Drawing.js";
import SiteVisit from "../models/SiteVisit.js";
import TestRecord from "../models/TestRecord.js";

const NOT_FOUND = { message: "Project not found." };


function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}


// client / professionals exist. Adds any problems to "errors".
async function checkDatabaseRules(data, errors, currentId) {
  if (!errors.project_code) {
    const sameCode = await Project.findOne({ project_code: data.project_code });
    if (sameCode && String(sameCode._id) !== currentId) {
      errors.project_code = "A project with this ID already exists.";
    }
  }
  if (data.client && !errors.client && !(await Client.exists({ _id: data.client }))) {
    errors.client = "Selected client no longer exists.";
  }
  for (const field of ["design_engineer", "draughtsman"]) {
    if (data[field] && !errors[field] && !(await Professional.exists({ _id: data[field] }))) {
      errors[field] = "Selected professional no longer exists.";
    }
  }
}

// Loads one project with its client and professionals filled in.
function findFullProject(id) {
  return Project.findById(id).populate("client").populate("design_engineer").populate("draughtsman");
}

// GET /api/projects?q=&status=&building_type=&start_from=&sort=
export async function getProjects(req, res) {
  const { q, status, building_type, start_from, sort } = req.query;

  // Build MongoDB filter from search box and drop-downs.
  const filter = {};
  if (q) {
    const pattern = new RegExp(escapeRegex(String(q).trim()), "i"); // "i" = ignore upper/lower case
    filter.$or = [{ project_code: pattern }, { name: pattern }];
  }
  if (status) filter.status = status;
  if (building_type) filter.building_type = building_type;
  if (start_from && /^\d{4}-\d{2}-\d{2}$/.test(start_from)) {
    filter.start_date = { $gte: new Date(`${start_from}T00:00:00Z`) };
  }

  let sortBy = { created_at: -1 }; // newest first
  if (sort === "name") sortBy = { name: 1 };
  if (sort === "deadline") sortBy = { expected_completion_date: 1 };

  const projects = await Project.find(filter).sort(sortBy).populate("client", "name client_id").populate("design_engineer", "name professional_id");
  res.json(projects);
}

// GET /api/projects/:id
export async function getProject(req, res) {
  if (!isValidId(req.params.id)) return res.status(404).json(NOT_FOUND);
  const project = await findFullProject(req.params.id);
  if (!project) return res.status(404).json(NOT_FOUND);
  res.json(project);
}

// POST /api/projects
export async function createProject(req, res) {
  const { errors, data } = validateProject(req.body);
  await checkDatabaseRules(data, errors);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: "Please correct the highlighted fields.", errors });
  }

  const project = await Project.create({ ...data, created_by: req.user.id });
  res.status(201).json(await findFullProject(project._id));
}

// PUT /api/projects/:id   (form sends every field, so all fields are replaced)
export async function updateProject(req, res) {
  if (!isValidId(req.params.id)) return res.status(404).json(NOT_FOUND);
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json(NOT_FOUND);

  const { errors, data } = validateProject(req.body);
  await checkDatabaseRules(data, errors, req.params.id);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: "Please correct the highlighted fields.", errors });
  }

  project.set(data); // created_by is not in "data", so it stay same
  await project.save();
  res.json(await findFullProject(project._id));
}

// DELETE /api/projects/:id
export async function deleteProject(req, res) {
  if (!isValidId(req.params.id)) return res.status(404).json(NOT_FOUND);
   // A project still has drawings, site visits or test records cannot be delete.
  const inUse =
    (await Drawing.exists({ project: req.params.id })) ||
    (await SiteVisit.exists({ project: req.params.id })) ||
    (await TestRecord.exists({ project: req.params.id }));
  if (inUse) {
    return res.status(400).json({ message: "This project still has drawings, site visits or test records. Delete them first." });
  }
  const deleted = await Project.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json(NOT_FOUND);
  res.status(204).end();
}
