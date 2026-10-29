import fs from "node:fs";
import path from "node:path";
import Drawing from "../models/Drawing.js";
import Project from "../models/Project.js";
import { isRealPdf, UPLOAD_DIR } from "../middleware/uploadMiddleware.js";
import { isValidId, validateDrawing, validateRevision } from "../utils/validation.js";

const NOT_FOUND = { message: "Drawing not found." };

// Removes file from backend/uploads.missing file is not problem.
function removeFile(storedName) {
  fs.promises.unlink(path.join(UPLOAD_DIR, storedName)).catch(() => {});
}

// One drawing with its project filled in. The server file names not sent to browser.
function findDrawing(id) {
  return Drawing.findById(id).select("-revisions.stored_name").populate("project", "project_code name");
}

// Checks project exists , drawing number is not already used.
async function checkDrawing(data, errors, currentId) {
  if (data.project && !errors.project && !(await Project.exists({ _id: data.project }))) {
    errors.project = "Selected project no longer exists.";
  }
  if (!errors.drawing_number) {
    const same = await Drawing.findOne({ drawing_number: data.drawing_number });
    if (same && String(same._id) !== currentId) errors.drawing_number = "A drawing with this number already exists.";
  }
}

// GET /api/drawings
export async function getDrawings(req, res) {
  const drawings = await Drawing.find()
    .sort({ drawing_number: 1 })
    .select("-revisions.stored_name")
    .populate("project", "project_code name");
  res.json(drawings);
}

// POST /api/drawings
export async function createDrawing(req, res) {
  const uploaded = req.file; // set by upload middleware when a PDF was sent
  try {
    const { errors, data } = validateDrawing(req.body);
    await checkDrawing(data, errors);
    if (uploaded && !(await isRealPdf(uploaded.path))) errors.file = "The file is not a valid PDF.";
    if (Object.keys(errors).length > 0) {
      if (uploaded) removeFile(uploaded.filename); // do not keep file of a rejected drawing
      return res.status(400).json({ message: "Please correct the highlighted fields.", errors });
    }

    // PDF sent together with new drawing becomes its first revision (A).
    const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");
    const revisions = uploaded
      ? [{
          revision: "A", revision_date: today, description: "First upload",
          original_name: uploaded.originalname, stored_name: uploaded.filename,
          size: uploaded.size, uploaded_by: req.user.id,
        }]
      : [];
    const drawing = await Drawing.create({ ...data, revisions });
    res.status(201).json(await findDrawing(drawing._id));
  } catch (error) {
    if (uploaded) removeFile(uploaded.filename); 
    throw error;
  }
}

// PUT /api/drawings/:id 
export async function updateDrawing(req, res) {
  if (!isValidId(req.params.id)) return res.status(404).json(NOT_FOUND);
  const drawing = await Drawing.findById(req.params.id);
  if (!drawing) return res.status(404).json(NOT_FOUND);

  const { errors, data } = validateDrawing(req.body);
  await checkDrawing(data, errors, req.params.id);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: "Please correct the highlighted fields.", errors });
  }
  drawing.set(data);
  await drawing.save();
  res.json(await findDrawing(drawing._id));
}

// DELETE /api/drawings/:id  
export async function deleteDrawing(req, res) {
  if (!isValidId(req.params.id)) return res.status(404).json(NOT_FOUND);
  const drawing = await Drawing.findByIdAndDelete(req.params.id);
  if (!drawing) return res.status(404).json(NOT_FOUND);
  for (const revision of drawing.revisions) removeFile(revision.stored_name);
  res.status(204).end();
}

// POST /api/drawings/:id/revisions  
export async function addRevision(req, res) {
  const uploaded = req.file; // saved by upload middleware before this runs
  // If anything is wrong file that was just saved is deleted again.
  const reject = (status, body) => {
    if (uploaded) removeFile(uploaded.filename);
    return res.status(status).json(body);
  };

  if (!isValidId(req.params.id)) return reject(404, NOT_FOUND);
  const drawing = await Drawing.findById(req.params.id);
  if (!drawing) return reject(404, NOT_FOUND);

  const { errors, data } = validateRevision(req.body);
  if (!uploaded) errors.file = "Choose a file to upload.";
    if (uploaded && !errors.file && !(await isRealPdf(uploaded.path))) errors.file = "The file is not a valid PDF.";
  if (!errors.revision && drawing.revisions.some((r) => r.revision === data.revision)) {
    errors.revision = "This revision already exists for this drawing.";
  }
  if (Object.keys(errors).length > 0) {
    return reject(400, { message: "Please correct the highlighted fields.", errors });
  }

  drawing.revisions.push({
    ...data,
    original_name: uploaded.originalname,
    stored_name: uploaded.filename,
    size: uploaded.size,
    uploaded_by: req.user.id,
  });
  await drawing.save();
  res.status(201).json(await findDrawing(drawing._id));
}

// GET /api/drawings/:id/revisions/:revisionId/file   (download)
export async function downloadRevision(req, res) {
  if (!isValidId(req.params.id) || !isValidId(req.params.revisionId)) return res.status(404).json(NOT_FOUND);
  const drawing = await Drawing.findById(req.params.id);
  const revision = drawing?.revisions.id(req.params.revisionId);
  if (!revision) return res.status(404).json({ message: "File not found." });

  res.download(path.join(UPLOAD_DIR, revision.stored_name), revision.original_name, (error) => {
    if (error && !res.headersSent) res.status(404).json({ message: "The file is missing on the server." });
  });
}