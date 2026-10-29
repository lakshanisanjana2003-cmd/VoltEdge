import jwt from "jsonwebtoken";
import User from "../models/User.js";

// The React app sends header:  Authorization: Bearer <token>
export async function requireLogin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ message: "Please sign in." });

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET); // throws if fake or expired
  } catch {
    return res.status(401).json({ message: "Your session has expired. Please sign in again." });
  }

  // role is read from database every time, so role change works at once.
  const user = await User.findById(payload.userId);
  if (!user) return res.status(401).json({ message: "Please sign in." });
  req.user = { id: String(user._id), role: user.role || "staff" };
  next();
}


export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Only an administrator can do this." });
  }
  next();
}