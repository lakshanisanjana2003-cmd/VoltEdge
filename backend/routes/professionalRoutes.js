import { Router } from "express";
import {
  createMyProfessional, createProfessional, deleteProfessional, getMyProfessional,
  getProfessionals, updateMyProfessional, updateProfessional,
} from "../controllers/professionalController.js";
import { requireAdmin, requireLogin } from "../middleware/authMiddleware.js";

const router = Router();
router.use(requireLogin);

// They must come BEFORE"/:id" route.
router.get("/me", getMyProfessional);
router.post("/me", createMyProfessional);
router.put("/me", updateMyProfessional);

router.get("/", getProfessionals);
router.post("/", createProfessional);
router.put("/:id", updateProfessional);
router.delete("/:id", requireAdmin, deleteProfessional); // only administrators may delete

export default router;