import mongoose from "mongoose";

// A tiny collection of counters. Each document is one counter, for example { _id: "staff_code", seq: 7 }.

const counterSchema = new mongoose.Schema(
  {
    _id: { type: String },
    seq: { type: Number, default: 0 },
  },
  { versionKey: false },
);

export default mongoose.model("Counter", counterSchema);