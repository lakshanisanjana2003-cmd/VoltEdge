import Professional from "../models/Professional.js";
import Project from "../models/Project.js";
import SiteVisit from "../models/SiteVisit.js";
import { isValidId, validateSiteVisit } from "../utils/validation.js";

const NOT_FOUND = { message: "Site visit not found." };

// Checks that chosen project and professional really exist.
async function checkLinks(data, errors) {
  if (data.project && !errors.project && !(await Project.exists({ _id: data.project }))) {
    errors.project = "Selected project no longer exists.";
  }
  if (data.visited_by && !errors.visited_by && !(await Professional.exists({ _id: data.visited_by }))) {
    errors.visited_by = "Selected professional no longer exists.";
  }
}

function findVisit(id) {
  return SiteVisit.findById(id).populate("project", "project_code name").populate("visited_by", "name professional_id");
}

// GET /api/site-visits
export async function getSiteVisits(req, res) {
  const visits = await SiteVisit.find()
    .sort({ visit_date: -1 })
    .populate("project", "project_code name")
    .populate("visited_by", "name professional_id");
  res.json(visits);
}

// POST /api/site-visits
export async function createSiteVisit(req, res) {
  const { errors, data } = validateSiteVisit(req.body);
  await checkLinks(data, errors);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: "Please correct the highlighted fields.", errors });
  }
  const visit = await SiteVisit.create(data);
  res.status(201).json(await findVisit(visit._id));
}

// PUT /api/site-visits/:id
export async function updateSiteVisit(req, res) {
  if (!isValidId(req.params.id)) return res.status(404).json(NOT_FOUND);
  const { errors, data } = validateSiteVisit(req.body);
  await checkLinks(data, errors);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: "Please correct the highlighted fields.", errors });
  }
  const visit = await SiteVisit.findByIdAndUpdate(req.params.id, data, { new: true });
  if (!visit) return res.status(404).json(NOT_FOUND);
  res.json(await findVisit(visit._id));
}

// DELETE /api/site-visits/:id
export async function deleteSiteVisit(req, res) {
  if (!isValidId(req.params.id)) return res.status(404).json(NOT_FOUND);
  const visit = await SiteVisit.findByIdAndDelete(req.params.id);
  if (!visit) return res.status(404).json(NOT_FOUND);
  res.status(204).end();
}