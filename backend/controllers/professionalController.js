import Professional from "../models/Professional.js";
import Project from "../models/Project.js";
import { isValidId, validateProfessional } from "../utils/validation.js";
import SiteVisit from "../models/SiteVisit.js";
import TestRecord from "../models/TestRecord.js";

const NOT_FOUND = { message: "Professional not found." };
// Check whether another professional already use this ID.
async function professionalIdIsTaken(professionalId, currentId) {
  if (!professionalId) return false;
  const other = await Professional.findOne({ professional_id: professionalId });
  return Boolean(other) && String(other._id) !== currentId;
}

// GET /api/professionals
export async function getProfessionals(req, res) {
  res.json(await Professional.find().sort({ name: 1 }));
}

// POST /api/professionals
export async function createProfessional(req, res) {
  const { errors, data } = validateProfessional(req.body);
  if (!errors.professional_id && (await professionalIdIsTaken(data.professional_id))) {
  errors.professional_id = "A professional with this ID already exists.";
}
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: "Please correct the highlighted fields.", errors });
  }
  res.status(201).json(await Professional.create(data));
}

// PUT /api/professionals/:id
export async function updateProfessional(req, res) {
  if (!isValidId(req.params.id)) return res.status(404).json(NOT_FOUND);
  const { errors, data } = validateProfessional(req.body);
  if (!errors.professional_id && (await professionalIdIsTaken(data.professional_id, req.params.id))) {
  errors.professional_id = "A professional with this ID already exists.";
}
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: "Please correct the highlighted fields.", errors });
  }
  const professional = await Professional.findByIdAndUpdate(req.params.id, data, { new: true });
  if (!professional) return res.status(404).json(NOT_FOUND);
  res.json(professional);
}

// DELETE /api/professionals/:id
export async function deleteProfessional(req, res) {
  if (!isValidId(req.params.id)) return res.status(404).json(NOT_FOUND);
  const professional = await Professional.findByIdAndDelete(req.params.id);
  if (!professional) return res.status(404).json(NOT_FOUND);
  // Projects keep existing, they just lose the link to this person.
  await Project.updateMany({ design_engineer: req.params.id }, { design_engineer: null });
  await Project.updateMany({ draughtsman: req.params.id }, { draughtsman: null });
  await SiteVisit.updateMany({ visited_by: req.params.id }, { visited_by: null });
  await TestRecord.updateMany({ tested_by: req.params.id }, { tested_by: null });
  res.status(204).end();
}

// GET /api/professionals/me   (the signed-in user's profile)
export async function getMyProfessional(req, res) {
  const profile = await Professional.findOne({ user: req.user.id });
  if (!profile) return res.status(404).json({ message: "You have no professional profile yet." });
  res.json(profile);
}

// POST /api/professionals/me   (create my profile; only one for one account)
export async function createMyProfessional(req, res) {
  if (await Professional.exists({ user: req.user.id })) {
    return res.status(400).json({ message: "You already have a professional profile." });
  }
  const { errors, data } = validateProfessional(req.body);
  if (!errors.professional_id && (await professionalIdIsTaken(data.professional_id))) {
    errors.professional_id = "A professional with this ID already exists.";
  }
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: "Please correct the highlighted fields.", errors });
  }
  res.status(201).json(await Professional.create({ ...data, user: req.user.id }));
}

// PUT /api/professionals/me   (edit my own profile)
export async function updateMyProfessional(req, res) {
  const profile = await Professional.findOne({ user: req.user.id });
  if (!profile) return res.status(404).json({ message: "You have no professional profile yet." });
  const { errors, data } = validateProfessional(req.body);
  if (!errors.professional_id && (await professionalIdIsTaken(data.professional_id, String(profile._id)))) {
    errors.professional_id = "A professional with this ID already exists.";
  }
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: "Please correct the highlighted fields.", errors });
  }
  profile.set(data); // "user" is not in data, so link to account never changes
  await profile.save();
  res.json(profile);
}