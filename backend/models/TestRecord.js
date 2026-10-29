import mongoose from "mongoose";
import { TEST_RESULTS } from "../utils/constants.js";

const testRecordSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    test_type: { type: String, required: true, trim: true }, // for example "Insulation resistance"
    test_date: { type: Date, required: true },
    tested_by: { type: mongoose.Schema.Types.ObjectId, ref: "Professional", default: null },
    result: { type: String, enum: TEST_RESULTS, default: "Pending" },
    measurements: { type: String, trim: true, default: null }, // the test results / measured values
    remarks: { type: String, trim: true, default: null },
    certificate_number: { type: String, trim: true, default: null },
    certificate_date: { type: Date, default: null },
  },
  { versionKey: false, timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

export default mongoose.model("TestRecord", testRecordSchema);