import { Router } from "express";
import { createSiteVisit, deleteSiteVisit, getSiteVisits, updateSiteVisit } from "../controllers/siteVisitController.js";
import { requireLogin } from "../middleware/authMiddleware.js";

const router = Router();
router.use(requireLogin);

router.get("/", getSiteVisits);
router.post("/", createSiteVisit);
router.put("/:id", updateSiteVisit);
router.delete("/:id", deleteSiteVisit);

export default router;