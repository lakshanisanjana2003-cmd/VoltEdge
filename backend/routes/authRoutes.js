import { Router } from "express";
import { getMyProfile, login, register } from "../controllers/authController.js";
import { requireLogin } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireLogin, getMyProfile);

export default router;
