import { Router } from "express";
import {
  createProfessional, deleteProfessional, getProfessionals, updateProfessional,
} from "../controllers/professionalController.js";
import { requireLogin } from "../middleware/authMiddleware.js";

const router = Router();
router.use(requireLogin);

router.get("/", getProfessionals);
router.post("/", createProfessional);
router.put("/:id", updateProfessional);
router.delete("/:id", deleteProfessional);

export default router;
