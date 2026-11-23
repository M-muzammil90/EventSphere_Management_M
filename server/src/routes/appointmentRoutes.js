import { Router } from "express";
import * as c from "../controllers/appointmentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { restrictTo } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import { createAppointmentSchema, respondAppointmentSchema } from "../validators/index.js";

const router = Router();
router.use(protect);

router.post("/", validate({ body: createAppointmentSchema }), c.createAppointment);
router.get("/mine", c.getMyAppointments);
router.patch("/:id/respond", validate({ body: respondAppointmentSchema }), c.respondToAppointment);
router.patch("/:id/cancel", c.cancelAppointment);

/* admin */
router.get("/", restrictTo("admin"), c.listAppointments);

export default router;
