import { Router } from "express";
import { getExpos, getExpo, createExpo, updateExpo, deleteExpo, setPublishState, uploadBanner, getMyExpos } from "../controllers/expoController.js";
import { protect, optionalAuth } from "../middleware/optionalAuth.js";
import { restrictTo } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import { uploadBanner as uploadBannerMW } from "../middleware/uploadMiddleware.js";
import { createExpoSchema, updateExpoSchema } from "../validators/index.js";

const router = Router();

/* ------------------------------ public ------------------------------ */
router.get("/", optionalAuth, getExpos);
router.get("/:idOrSlug", optionalAuth, getExpo);

/* --------------------------- organizer ------------------------------ */
router.use(protect, restrictTo("admin", "organizer"));

router.get("/admin/mine", getMyExpos);
router.post("/", validate({ body: createExpoSchema }), createExpo);
router.patch("/:id", validate({ body: updateExpoSchema }), updateExpo);
router.delete("/:id", deleteExpo);
router.patch("/:id/publish", setPublishState);
router.post("/:id/banner", uploadBannerMW, uploadBanner);

export default router;
