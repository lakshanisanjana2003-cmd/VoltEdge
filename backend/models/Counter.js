import mongoose from "mongoose";

// A tiny collection of counters. Each document is one counter, for example { _id: "staff_code", seq: 7 }.
// The number is increased inside the database in ONE step, so two requests can never get the same number.
const counterSchema = new mongoose.Schema(
  {
    _id: { type: String },
    seq: { type: Number, default: 0 },
  },
  { versionKey: false },
);

export default mongoose.model("Counter", counterSchema);