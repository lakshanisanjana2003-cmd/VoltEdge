import { Router } from "express";
import { changeUserRole, getUsers } from "../controllers/userController.js";
import { requireAdmin, requireLogin } from "../middleware/authMiddleware.js";

const router = Router();
router.use(requireLogin, requireAdmin); // every user route is administrators only

router.get("/", getUsers);
router.put("/:id/role", changeUserRole);

export default router;