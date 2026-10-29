import mongoose from "mongoose";
import { DOCUMENT_TYPES, DRAWING_STATUSES } from "../utils/constants.js";

// Each revision of drawing / document is saved inside drawing (embedded list).
const revisionSchema = new mongoose.Schema({
  revision: { type: String, required: true, uppercase: true, trim: true }, // A, B, C ... or 01, 02
  revision_date: { type: Date, required: true },
  description: { type: String, trim: true, default: null },
  original_name: { type: String, required: true }, // file name on the user's computer
  stored_name: { type: String, required: true }, // random file name in backend/uploads
  size: { type: Number, required: true }, // bytes
  uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  uploaded_at: { type: Date, default: Date.now }, // when the file was uploaded
});

const drawingSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    drawing_number: { type: String, required: true, unique: true, uppercase: true, trim: true },
    title: { type: String, required: true, trim: true },
    document_type: { type: String, enum: DOCUMENT_TYPES, default: "Drawing" },
    status: { type: String, enum: DRAWING_STATUSES, default: "Draft" },
    notes: { type: String, trim: true, default: null },
    revisions: [revisionSchema],
  },
  { versionKey: false, timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

export default mongoose.model("Drawing", drawingSchema);