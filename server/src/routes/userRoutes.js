import { Router } from "express";
import * as c from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { restrictTo } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import { uploadLogo } from "../middleware/uploadMiddleware.js";
import { exhibitorProfileSchema } from "../validators/index.js";

const router = Router();
router.use(protect);

/* self-service */
router.get("/me", c.getProfile);
router.patch("/me", c.updateProfile);
router.post("/me/avatar", uploadLogo, c.updateAvatar);
router.patch("/me/preferences", c.updatePreferences);

/* admin */
router.get("/", restrictTo("admin"), c.listUsers);
router.get("/:id", restrictTo("admin"), c.getUser);
router.patch("/:id/active", restrictTo("admin"), c.setUserActive);

export default router;
