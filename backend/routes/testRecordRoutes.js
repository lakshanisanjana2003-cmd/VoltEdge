import { Router } from "express";
import { createTestRecord, deleteTestRecord, getTestRecords, updateTestRecord } from "../controllers/testRecordController.js";
import { requireLogin } from "../middleware/authMiddleware.js";

const router = Router();
router.use(requireLogin);

router.get("/", getTestRecords);
router.post("/", createTestRecord);
router.put("/:id", updateTestRecord);
router.delete("/:id", deleteTestRecord);

export default router;