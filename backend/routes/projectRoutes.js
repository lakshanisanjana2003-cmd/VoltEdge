import { Router } from "express";
import { createProject, deleteProject, getProject, getProjects, updateProject } from "../controllers/projectController.js";
import { requireLogin } from "../middleware/authMiddleware.js";

const router = Router();
router.use(requireLogin); // every project route needs a signed-in staff member

router.get("/", getProjects);
router.post("/", createProject);
router.get("/:id", getProject);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);

export default router;
