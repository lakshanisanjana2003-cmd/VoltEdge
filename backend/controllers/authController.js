import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { validateLogin, validateRegistration } from "../utils/validation.js";

// The user details that are safe to send to the browser (never the password hash).
function publicUser(user) {
  return { _id: user._id, full_name: user.full_name, officer_id: user.officer_id, staff_code: user.staff_code };
}

function makeToken(user) {
  return jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

// Gives each new staff member the next office number: U01, U02, U03 ...
async function nextStaffCode() {
  const count = await User.countDocuments();
  let number = count + 1;
  while (await User.exists({ staff_code: "U" + String(number).padStart(2, "0") })) number++;
  return "U" + String(number).padStart(2, "0");
}

// POST /api/auth/register   { full_name, officer_id, password }
export async function register(req, res) {
  const { errors, data } = validateRegistration(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: Object.values(errors)[0], errors });
  }

  const officerId = data.officer_id.toUpperCase();
  if (await User.exists({ officer_id: officerId })) {
    const message = "This Officer ID is already registered.";
    return res.status(400).json({ message, errors: { officer_id: message } });
  }

  const user = await User.create({
    full_name: data.full_name,
    officer_id: officerId,
    staff_code: await nextStaffCode(),
    password_hash: await bcrypt.hash(data.password, 10), // never save the real password
  });
  res.status(201).json({ token: makeToken(user), user: publicUser(user) });
}

// POST /api/auth/login   { officer_id (or staff number such as U01), password }
export async function login(req, res) {
  const { errors, data } = validateLogin(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: Object.values(errors)[0], errors });
  }

  const code = data.officer_id.toUpperCase();
  const user = await User.findOne({ $or: [{ officer_id: code }, { staff_code: code }] });
  const passwordIsCorrect = user ? await bcrypt.compare(data.password, user.password_hash) : false;

  // The same message for "no such user" and "wrong password".
  if (!passwordIsCorrect) return res.status(401).json({ message: "Officer ID or password is incorrect." });
  res.json({ token: makeToken(user), user: publicUser(user) });
}

// GET /api/auth/me   (needs a token)
export async function getMyProfile(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(401).json({ message: "Please sign in." });
  res.json(publicUser(user));
}
