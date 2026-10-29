import "dotenv/config";
import mongoose from "mongoose";
import User from "./models/User.js";


async function makeAdmin() {
  const code = (process.argv[2] || "").trim().toUpperCase();
  if (!code) {
    console.log("Usage: npm run make-admin -- <Officer ID or staff number>");
    return;
  }
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOneAndUpdate(
    { $or: [{ officer_id: code }, { staff_code: code }] },
    { role: "admin" },
    { new: true },
  );
  console.log(user ? `${user.full_name} (${user.officer_id}) is now an administrator.` : `No account found for "${code}".`);
}

makeAdmin()
  .catch((error) => console.error("Failed:", error.message))
  .finally(() => mongoose.disconnect());