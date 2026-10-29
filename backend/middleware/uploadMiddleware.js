import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";

// Files saved in backend/uploads. They are NOT served as public
// they can only be downloaded through API by signed-in user.
export const UPLOAD_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_EXTENSIONS = [".pdf"]; // drawings are uploaded as PDF files only

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  //random name,user can never choose where file is written.
  filename: (req, file, cb) => cb(null, crypto.randomUUID() + path.extname(file.originalname).toLowerCase()),
});

// Accept exactly one file in form field named "file" up to 10 MB.
export const uploadFile = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_EXTENSIONS.includes(path.extname(file.originalname).toLowerCase())) return cb(null, true);
    const error = new Error("Only PDF files are allowed.");
    error.status = 400;
    cb(error);
  },
}).single("file");

// A file name can lie, so we also look at the first bytes of the saved file. Every real PDF starts with "%PDF-".
export async function isRealPdf(filePath) {
  const handle = await fs.promises.open(filePath, "r");
  try {
    const buffer = Buffer.alloc(5);
    await handle.read(buffer, 0, 5, 0);
    return buffer.toString("latin1") === "%PDF-";
  } finally {
    await handle.close();
  }
}