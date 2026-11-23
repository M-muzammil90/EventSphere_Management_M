import { Router } from "express";
import * as c from "../controllers/feedbackController.js";
import { protect } from "../middleware/authMiddleware.js";
import { restrictTo } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import { createFeedbackSchema, replyFeedbackSchema } from "../validators/index.js";

const router = Router();

/* ------------------------------ public ------------------------------ */
router.get("/public", c.getPublicReviews);

/* --------------------------- authenticated -------------------------- */
router.use(protect);
router.post("/", validate({ body: createFeedbackSchema }), c.submitFeedback);
router.get("/mine", c.listFeedback);
router.delete("/:id", c.deleteFeedback);

/* ----------------------------- admin -------------------------------- */
// Any authenticated user may call this; the controller scopes non-staff
// users to their own feedback only (ownership enforced in the query).
router.get("/", c.listFeedback);
router.get("/stats", restrictTo("admin"), c.getRatingBreakdown);
router.patch("/:id/reply", restrictTo("admin"), validate({ body: replyFeedbackSchema }), c.replyToFeedback);
router.patch("/:id/status", restrictTo("admin"), c.setFeedbackStatus);

export default router;
