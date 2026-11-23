import { Router } from "express";
import * as c from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();
router.use(protect);

router.get("/", c.getNotifications);
router.get("/unread-count", c.getUnreadCount);
router.patch("/:id/read", c.markRead);
router.patch("/read-all", c.markAllRead);
router.delete("/:id", c.deleteNotification);

export default router;
