import { Router } from "express";
import {
  addRevision, createDrawing, deleteDrawing, downloadRevision, getDrawings, updateDrawing,
} from "../controllers/drawingController.js";
import { requireLogin } from "../middleware/authMiddleware.js";
import { uploadFile } from "../middleware/uploadMiddleware.js";

const router = Router();
router.use(requireLogin);

router.get("/", getDrawings);
router.post("/", uploadFile, createDrawing); 
router.put("/:id", updateDrawing);
router.delete("/:id", deleteDrawing);
router.post("/:id/revisions", uploadFile, addRevision);
router.get("/:id/revisions/:revisionId/file", downloadRevision);

export default router;