import { Router } from "express";
import * as c from "../controllers/analyticsController.js";
import { protect } from "../middleware/authMiddleware.js";
import { restrictTo } from "../middleware/roleMiddleware.js";

const router = Router();
router.use(protect);

/* any signed-in user may read their own engagement summary */
router.get("/engagement", c.getEngagementSummary);

/* the remaining reports are staff-only */
router.use(restrictTo("admin"));

router.get("/overview", c.getOverview);
router.get("/attendees", c.getAttendeeAnalytics);
router.get("/booths", c.getBoothAnalytics);
router.get("/sessions", c.getSessionAnalytics);
router.get("/events", c.getEventAnalytics);
router.get("/revenue", c.getRevenueAnalytics);

export default router;
