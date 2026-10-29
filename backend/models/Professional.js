import mongoose from "mongoose";
import { PROFESSIONAL_ROLES } from "../utils/constants.js";

const professionalSchema = new mongoose.Schema(
  {
    professional_id: { type: String, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, enum: PROFESSIONAL_ROLES },
    organization: { type: String, trim: true, default: null },
    qualifications: { type: String, trim: true, default: null },
    phone: { type: String, trim: true, default: null },
    email: { type: String, trim: true, default: null },
    notes: { type: String, trim: true, default: null },
        // The login account profile belongs to. Only "my profile" route set it.
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true, sparse: true },
  },
  { versionKey: false, timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

export default mongoose.model("Professional", professionalSchema);
