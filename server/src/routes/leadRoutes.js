import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { restrictTo } from "../middleware/roleMiddleware.js";
import c from "../controllers/leadController.js";

const router = Router();
router.use(protect);

router.get("/", restrictTo("exhibitor", "admin", "organizer"), c.getMyLeads);
router.post("/", restrictTo("exhibitor", "admin"), c.createLead);
router.patch("/:id", restrictTo("exhibitor", "admin"), c.updateLead);
router.delete("/:id", restrictTo("exhibitor", "admin"), c.deleteLead);

export default router;
