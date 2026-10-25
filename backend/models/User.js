import mongoose from "mongoose";

// A staff member who can sign in. The password is saved only as a bcrypt hash.
const userSchema = new mongoose.Schema(
  {
    full_name: { type: String, required: true, trim: true },
    officer_id: { type: String, required: true, unique: true, uppercase: true, trim: true },
    staff_code: { type: String, unique: true }, // simple office number: U01, U02 ...
    password_hash: { type: String, required: true },
  },
  { versionKey: false, timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

export default mongoose.model("User", userSchema);
