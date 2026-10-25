import jwt from "jsonwebtoken";

// Put this before any route that needs a signed-in staff member.
// The React app sends the header:  Authorization: Bearer <token>
export function requireLogin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ message: "Please sign in." });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET); // throws if fake or expired
    req.user = { id: payload.userId };
    next();
  } catch {
    res.status(401).json({ message: "Your session has expired. Please sign in again." });
  }
}
