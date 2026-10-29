import { Router } from "express";
import { createClient, deleteClient, getClients, updateClient } from "../controllers/clientController.js";
import { requireAdmin, requireLogin } from "../middleware/authMiddleware.js";

const router = Router();
router.use(requireLogin);

router.get("/", getClients);
router.post("/", createClient);
router.put("/:id", updateClient);
router.delete("/:id", requireAdmin, deleteClient); // only administrators may delete

export default router;