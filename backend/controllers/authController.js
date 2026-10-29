import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Counter from "../models/Counter.js";
import User from "../models/User.js";
import { validateLogin, validateRegistration } from "../utils/validation.js";

// The user details safe to send 
function publicUser(user) {
    return { _id: user._id, full_name: user.full_name, officer_id: user.officer_id, staff_code: user.staff_code, role: user.role || "staff" };
}

function makeToken(user) {
  return jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

// Gives each new staff member the next staff ID: U01, U02, U03 ...
// The number comes from a counter in the database that is increased in ONE atomic step,
// so two people registering at the same time can never get the same ID.
async function nextStaffCode() {
  // First time only: start the counter at the highest number already used, so old IDs are kept.
  if (!(await Counter.exists({ _id: "staff_code" }))) {
    const users = await User.find({ staff_code: /^U\d+$/ }, "staff_code");
    const highest = Math.max(0, ...users.map((user) => Number(user.staff_code.slice(1))));
    try {
      await Counter.create({ _id: "staff_code", seq: highest });
    } catch (error) {
      if (error.code !== 11000) throw error; // another registration created it first: that is fine
    }
  }
  const counter = await Counter.findOneAndUpdate({ _id: "staff_code" }, { $inc: { seq: 1 } }, { new: true });
  return "U" + String(counter.seq).padStart(2, "0");
}

// POST /api/auth/register   { full_name, officer_id, password }
export async function register(req, res) {
  const { errors, data } = validateRegistration(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: Object.values(errors)[0], errors });
  }

  const officerId = data.officer_id.toUpperCase();
  const alreadyRegistered = "This Officer ID is already registered.";
  if (await User.exists({ officer_id: officerId })) {
    return res.status(400).json({ message: alreadyRegistered, errors: { officer_id: alreadyRegistered } });
  }

  const password_hash = await bcrypt.hash(data.password, 10); // never save the real password

  // The database has unique indexes as a second safety net. If the staff ID is somehow taken,
  // the counter has already moved on, so we simply try again with the next number.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const user = await User.create({
        full_name: data.full_name,
        officer_id: officerId,
        staff_code: await nextStaffCode(),
        password_hash,
      });
      return res.status(201).json({ token: makeToken(user), user: publicUser(user) });
    } catch (error) {
      if (error.code !== 11000) throw error;
      if (error.keyPattern?.officer_id || /officer_id/.test(error.message)) {
        // Two people used the same Officer ID at the same moment.
        return res.status(400).json({ message: alreadyRegistered, errors: { officer_id: alreadyRegistered } });
      }
    }
  }
  res.status(500).json({ message: "Could not create the account. Please try again." });
}
// POST /api/auth/login  
export async function login(req, res) {
  const { errors, data } = validateLogin(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: Object.values(errors)[0], errors });
  }

  const code = data.officer_id.toUpperCase();
  const user = await User.findOne({ $or: [{ officer_id: code }, { staff_code: code }] });
  const passwordIsCorrect = user ? await bcrypt.compare(data.password, user.password_hash) : false;

  //  no such user and wrong password.
  if (!passwordIsCorrect) return res.status(401).json({ message: "Officer ID or password is incorrect." });
  res.json({ token: makeToken(user), user: publicUser(user) });
}

// GET /api/auth/me needs a token
export async function getMyProfile(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(401).json({ message: "Please sign in." });
  res.json(publicUser(user));
}
