import { Router } from "express";
import * as c from "../controllers/registrationController.js";
import { protect } from "../middleware/authMiddleware.js";
import { restrictTo } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import { eventRegistrationSchema } from "../validators/index.js";

const router = Router();
router.use(protect);

router.post("/", validate({ body: eventRegistrationSchema }), c.registerForExpo);
router.get("/mine", c.getMyRegistrations);
router.get("/:id", c.getRegistration);
router.patch("/:id/cancel", c.cancelRegistration);

/* admin: badge check-in */
router.post("/check-in", restrictTo("admin"), c.checkIn);

export default router;
