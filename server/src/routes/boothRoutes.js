import { Router } from "express";
import * as c from "../controllers/boothController.js";
import { protect } from "../middleware/authMiddleware.js";
import { restrictTo } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import { createBoothSchema, updateBoothSchema, reserveBoothSchema, assignBoothSchema } from "../validators/index.js";

const router = Router();

/* ------------------------------ public ------------------------------ */
router.get("/expo/:expoId", c.getFloorPlan);
router.get("/expo/:expoId/availability", c.getAvailability);
router.get("/:id", c.getBooth);

/* --------------------------- authenticated -------------------------- */
router.use(protect);

// exhibitor self-service
router.post("/:id/reserve", restrictTo("exhibitor"), validate({ body: reserveBoothSchema }), c.reserveBooth);
router.post("/:id/release", restrictTo("exhibitor", "admin", "organizer"), c.releaseBooth);
router.get("/mine", restrictTo("exhibitor", "admin", "organizer"), c.getMyBooths);

/* ----------------------------- admin -------------------------------- */
router.post("/", restrictTo("admin", "organizer"), validate({ body: createBoothSchema }), c.createBooth);
router.post("/bulk", restrictTo("admin", "organizer"), c.bulkCreateBooths);
router.patch("/:id", restrictTo("admin", "organizer"), validate({ body: updateBoothSchema }), c.updateBooth);
router.delete("/:id", restrictTo("admin", "organizer"), c.deleteBooth);
router.post("/:id/assign", restrictTo("admin", "organizer"), validate({ body: assignBoothSchema }), c.assignBooth);

export default router;
