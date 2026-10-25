import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    company: { type: String, trim: true, default: null },
    contact_person: { type: String, trim: true, default: null },
    phone: { type: String, trim: true, default: null },
    email: { type: String, trim: true, default: null },
    address: { type: String, trim: true, default: null },
    notes: { type: String, trim: true, default: null },
  },
  { versionKey: false, timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

export default mongoose.model("Client", clientSchema);
