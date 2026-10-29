import User from "../models/User.js";
import { isValidId } from "../utils/validation.js";

// user details that safe to send to browser (never password hash).
function publicUser(user) {
  return { _id: user._id, full_name: user.full_name, officer_id: user.officer_id, staff_code: user.staff_code, role: user.role || "staff" };
}

// GET /api/users   (administrators only)
export async function getUsers(req, res) {
  const users = await User.find().sort({ created_at: 1 });
  res.json(users.map(publicUser));
}

// PUT /api/users/:id/role   { role: "admin" or "staff" }   (administrators only)
export async function changeUserRole(req, res) {
  if (!isValidId(req.params.id)) return res.status(404).json({ message: "User not found." });
  if (!["admin", "staff"].includes(req.body.role)) {
    return res.status(400).json({ message: "Role must be admin or staff.", errors: { role: "Role must be admin or staff." } });
  }
  // Nobody can change their own role. means there is always at least 1 administrator left.
  if (req.params.id === req.user.id) {
    return res.status(400).json({ message: "You cannot change your own role." });
  }
  const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true });
  if (!user) return res.status(404).json({ message: "User not found." });
  res.json(publicUser(user));
}