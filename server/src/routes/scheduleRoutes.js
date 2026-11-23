import { Router } from "express";
import * as c from "../controllers/scheduleController.js";
import { protect } from "../middleware/authMiddleware.js";
import { restrictTo } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import { createSessionSchema, updateSessionSchema, sessionRegistrationSchema } from "../validators/index.js";

const router = Router();

/* ------------------------------ public ------------------------------ */
router.get("/", c.getSessions);
router.get("/mine", protect, c.getMySchedule);
router.get("/:id", c.getSession);

/* --------------------------- authenticated -------------------------- */
router.use(protect);
router.post("/:id/register", validate({ body: sessionRegistrationSchema }), c.registerForSession);
router.delete("/:id/register", c.cancelSessionRegistration);

/* ----------------------------- admin & organizer -------------------- */
router.post("/", restrictTo("admin", "organizer"), validate({ body: createSessionSchema }), c.createSession);
router.patch("/:id", restrictTo("admin", "organizer"), validate({ body: updateSessionSchema }), c.updateSession);
router.delete("/:id", restrictTo("admin", "organizer"), c.deleteSession);

export default router;
