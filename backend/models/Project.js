import mongoose from "mongoose";
import { BUILDING_TYPES, PROJECT_PRIORITIES, PROJECT_STATUSES } from "../utils/constants.js";

const text = { type: String, trim: true, default: null }; // optional text field

// RELATIONSHIPS (each one stores the _id of a document in another collection):
//   client          -> Client        (one client can have many projects)
//   design_engineer -> Professional
//   draughtsman     -> Professional
//   created_by      -> User
// The controller uses .populate() to replace these ids with the real documents.
const projectSchema = new mongoose.Schema(
  {
    project_code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: "Client", default: null },
    building_type: { type: String, required: true, enum: BUILDING_TYPES },
    location: text,
    description: text,
    project_stage: text,
    consulting_organization: text,
    project_duration: text,
    activity_history: text, // one activity per line
    start_date: { type: Date, default: null },
    expected_completion_date: { type: Date, default: null },
    actual_completion_date: { type: Date, default: null },
    status: { type: String, enum: PROJECT_STATUSES, default: "Planned" },
    priority: { type: String, enum: PROJECT_PRIORITIES, default: "Not recorded" },
    design_engineer: { type: mongoose.Schema.Types.ObjectId, ref: "Professional", default: null },
    draughtsman: { type: mongoose.Schema.Types.ObjectId, ref: "Professional", default: null },
    main_contractor: text,
    notes: text,
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { versionKey: false, timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

export default mongoose.model("Project", projectSchema);
