import { Router } from "express";
import { register, login, logout, getMe, updatePassword, forgotPassword, resetPassword, verifyResetToken, getSessions } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import { authLimiter, passwordResetLimiter } from "../middleware/rateLimit.js";
import { uploadLogo, optionalUpload } from "../middleware/uploadMiddleware.js";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, updatePasswordSchema } from "../validators/index.js";

const router = Router();

/* ------------------------------ public ------------------------------ */
router.post("/register", authLimiter, optionalUpload(uploadLogo), validate({ body: registerSchema }), register);
router.post("/login", authLimiter, validate({ body: loginSchema }), login);
router.post("/logout", logout);

router.post("/forgot-password", passwordResetLimiter, validate({ body: forgotPasswordSchema }), forgotPassword);
router.get("/reset-password/:token", verifyResetToken);
router.post("/reset-password/:token", passwordResetLimiter, validate({ body: resetPasswordSchema }), resetPassword);

/* ---------------------------- protected ----------------------------- */
router.use(protect);
router.get("/me", getMe);
router.patch("/update-password", validate({ body: updatePasswordSchema }), updatePassword);
router.get("/sessions", getSessions);

export default router;
