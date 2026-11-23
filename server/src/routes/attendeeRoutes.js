import { Router } from "express";
import * as c from "../controllers/attendeeController.js";
import { protect } from "../middleware/authMiddleware.js";
import { restrictTo } from "../middleware/roleMiddleware.js";

const router = Router();

/* admin-only views of attendee records */
router.use(protect, restrictTo("admin"));

router.get("/", c.listAttendees);
router.get("/stats", c.getAttendeeStats);
router.get("/:id", c.getAttendee);
router.patch("/:id/registration/:regId", c.setRegistrationStatus);

export default router;
