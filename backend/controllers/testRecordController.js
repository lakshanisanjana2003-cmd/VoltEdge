import Professional from "../models/Professional.js";
import Project from "../models/Project.js";
import TestRecord from "../models/TestRecord.js";
import { isValidId, validateTestRecord } from "../utils/validation.js";

const NOT_FOUND = { message: "Test record not found." };

async function checkLinks(data, errors) {
  if (data.project && !errors.project && !(await Project.exists({ _id: data.project }))) {
    errors.project = "Selected project no longer exists.";
  }
  if (data.tested_by && !errors.tested_by && !(await Professional.exists({ _id: data.tested_by }))) {
    errors.tested_by = "Selected professional no longer exists.";
  }
}

function findRecord(id) {
  return TestRecord.findById(id).populate("project", "project_code name").populate("tested_by", "name professional_id");
}

// GET /api/test-records
export async function getTestRecords(req, res) {
  const records = await TestRecord.find()
    .sort({ test_date: -1 })
    .populate("project", "project_code name")
    .populate("tested_by", "name professional_id");
  res.json(records);
}

// POST /api/test-records
export async function createTestRecord(req, res) {
  const { errors, data } = validateTestRecord(req.body);
  await checkLinks(data, errors);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: "Please correct the highlighted fields.", errors });
  }
  const record = await TestRecord.create(data);
  res.status(201).json(await findRecord(record._id));
}

// PUT /api/test-records/:id
export async function updateTestRecord(req, res) {
  if (!isValidId(req.params.id)) return res.status(404).json(NOT_FOUND);
  const { errors, data } = validateTestRecord(req.body);
  await checkLinks(data, errors);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: "Please correct the highlighted fields.", errors });
  }
  const record = await TestRecord.findByIdAndUpdate(req.params.id, data, { new: true });
  if (!record) return res.status(404).json(NOT_FOUND);
  res.json(await findRecord(record._id));
}

// DELETE /api/test-records/:id
export async function deleteTestRecord(req, res) {
  if (!isValidId(req.params.id)) return res.status(404).json(NOT_FOUND);
  const record = await TestRecord.findByIdAndDelete(req.params.id);
  if (!record) return res.status(404).json(NOT_FOUND);
  res.status(204).end();
}