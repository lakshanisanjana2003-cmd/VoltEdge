import mongoose from "mongoose";

// staff member can sign in.password is saved only as bcrypt hash.
const userSchema = new mongoose.Schema(
  {
    full_name: { type: String, required: true, trim: true },
    officer_id: { type: String, required: true, unique: true, uppercase: true, trim: true },
    staff_code: { type: String, unique: true }, // simple office number
    role: { type: String, enum: ["admin", "staff"], default: "staff" }, // existing accounts count as staff
    password_hash: { type: String, required: true },
  },
  { versionKey: false, timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

export default mongoose.model("User", userSchema);
