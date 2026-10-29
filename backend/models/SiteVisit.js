import mongoose from "mongoose";
import { VISIT_STATUSES } from "../utils/constants.js";

const siteVisitSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    visit_date: { type: Date, required: true },
    visited_by: { type: mongoose.Schema.Types.ObjectId, ref: "Professional", default: null },
    purpose: { type: String, trim: true, default: null },
    inspection_notes: { type: String, trim: true, default: null },
    follow_up_actions: { type: String, trim: true, default: null },
    status: { type: String, enum: VISIT_STATUSES, default: "Scheduled" },
  },
  { versionKey: false, timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

export default mongoose.model("SiteVisit", siteVisitSchema);