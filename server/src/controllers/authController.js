import crypto from "node:crypto";
import User from "../models/User.js";
import ExhibitorProfile from "../models/ExhibitorProfile.js";
import RevokedToken from "../models/RevokedToken.js";
import { ApiError, ApiResponse, asyncHandler } from "../utils/ApiResponse.js";
import { signToken, verifyToken, cookieOptions, clearCookieOptions, cookieName, hashToken } from "../utils/generateToken.js";
import { setCsrfCookie, CSRF_COOKIE_NAME } from "../middleware/csrfMiddleware.js";
import { assertPublicRegisterableRole } from "../middleware/roleMiddleware.js";
import { notificationService } from "../services/notificationService.js";
import emailService from "../services/emailService.js";
import { uploadAsset } from "../services/cloudinaryService.js";

/* Sends the JWT as an HttpOnly cookie AND returns it in the body once so
   non-browser clients can use the Authorization header. */
const sendAuthResponse = (res, user, statusCode = 200, message, extra = {}) => {
  const token = signToken({ id: user._id, role: user.role, email: user.email });
  res.cookie(cookieName(), token, cookieOptions());
  const csrfToken = setCsrfCookie(res);
  // ApiResponse.ok hard-codes 200, so build the envelope directly here
  return res.status(statusCode).json({ success: true, data: { user: user.safeJSON(), token, csrfToken, ...extra }, ...(message ? { message } : {}) });
};

/* ============================ REGISTER ============================= */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, jobTitle, company } = req.body;

  // SECURITY: block public self-promotion to Admin/Organizer
  assertPublicRegisterableRole(role);

  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict("An account with this email already exists");

  const user = await User.create({
    name, email, password, role,
    phone, jobTitle,
    ...(req.file && { avatar: (await uploadAsset(req.file, { folder: "logos" })).url }),
  });

  // Exhibitors get a company profile scaffold immediately
  if (role === "exhibitor") {
    await ExhibitorProfile.create({
      user: user._id,
      company: { name: company || `${name}'s company` },
      category: "Other",
      contact: { primaryName: name, email, phone },
      verificationStatus: "pending",
    });
  }

  await notificationService.notify({
    recipient: user._id,
    type: "system",
    title: "Welcome to EventSphere 🎉",
    body:
      role === "exhibitor"
        ? "Complete your company profile and upload your documents to start applying for expos."
        : "Browse upcoming expos and bookmark sessions to build your agenda.",
    link: role === "exhibitor" ? "/portal" : "/attendee",
    priority: "normal",
  });

  let emailResult = { sent: false, previewUrl: null };
  try {
    emailResult = await emailService.sendWelcome({ to: user.email, name: user.name, role });
  } catch (err) {
    console.error("Welcome email failed:", err.message);
  }

  return sendAuthResponse(res, user, 201, "Account created successfully. Please sign in to continue.", {
    emailSent: Boolean(emailResult?.sent),
    emailPreviewUrl: emailResult?.previewUrl || null,
  });
});

/* ============================= LOGIN =============================== */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // +password required because select:false in the schema
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized("Incorrect email or password");
  }
  if (!user.isActive) throw ApiError.forbidden("This account has been deactivated");

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  return sendAuthResponse(res, user, 200, `Welcome back, ${user.name.split(" ")[0]}`);
});

/* ============================= LOGOUT ============================== */
export const logout = asyncHandler(async (req, res) => {
  let token = req.cookies?.[cookieName()];
  const header = req.headers.authorization;
  if (!token && header?.startsWith("Bearer ")) token = header.slice(7);

  if (token) {
    try {
      const decoded = verifyToken(token);
      const expiresAt = decoded.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await RevokedToken.updateOne(
        { tokenHash: hashToken(token) },
        { $setOnInsert: { tokenHash: hashToken(token), user: decoded.id, expiresAt } },
        { upsert: true }
      );
    } catch {
      // Token already invalid/expired — still clear cookies cleanly
    }
  }

  res.clearCookie(cookieName(), clearCookieOptions());
  res.clearCookie(CSRF_COOKIE_NAME, { path: "/" });
  return ApiResponse.ok(res, null, "Signed out successfully");
});

/* =========================== CSRF TOKEN ============================ */
export const getCsrfToken = asyncHandler(async (req, res) => {
  const existing = req.cookies?.[CSRF_COOKIE_NAME];
  const csrfToken = setCsrfCookie(res, existing);
  return ApiResponse.ok(res, { csrfToken });
});

/* ============================== ME ================================ */
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound("Account not found");

  let exhibitorProfile = null;
  if (user.role === "exhibitor") {
    exhibitorProfile = await ExhibitorProfile.findOne({ user: user._id });
  }

  const unread = await import("../models/Notification.js").then(({ default: N }) =>
    N.countDocuments({ recipient: user._id, read: false })
  );

  return ApiResponse.ok(res, { user: user.safeJSON(), exhibitorProfile, unreadNotifications: unread });
});

/* ======================= UPDATE PASSWORD =========================== */
export const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, password } = req.body;
  const user = await User.findById(req.user._id).select("+password");

  if (!(await user.comparePassword(currentPassword))) {
    throw ApiError.unauthorized("Your current password is incorrect");
  }

  user.password = password; // hashed by the pre-save hook
  await user.save();

  // Invalidate every other session
  res.cookie(cookieName(), signToken({ id: user._id, role: user.role, email: user.email }), cookieOptions());
  emailService.sendPasswordChanged({ to: user.email, name: user.name }).catch(() => {});

  return ApiResponse.ok(res, null, "Password updated successfully");
});

/* ===================== FORGOT PASSWORD ============================ */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email }).select("+passwordResetToken +passwordResetExpires");

  // Always return success — never reveal whether the email exists
  if (!user) {
    return ApiResponse.ok(res, null, "If an account exists for that email, a reset link has been sent");
  }

  const rawToken = user.createPasswordResetToken(); // stores only the hash
  await user.save({ validateBeforeSave: false });

  emailService
    .sendPasswordReset({ to: user.email, name: user.name, token: rawToken })
    .catch((err) => console.error("Reset email failed:", err.message));

  return ApiResponse.ok(res, null, "If an account exists for that email, a reset link has been sent");
});

/* ================== VERIFY RESET TOKEN (GET) ====================== */
export const verifyResetToken = asyncHandler(async (req, res) => {
  const hashed = hashToken(req.params.token);
  const user = await User.findOne({
    passwordResetToken: hashed,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) throw ApiError.badRequest("This reset link is invalid or has expired");

  return ApiResponse.ok(res, { valid: true, email: user.email }, "Reset link is valid");
});

/* ======================= RESET PASSWORD =========================== */
export const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const hashed = hashToken(req.params.token);

  const user = await User.findOne({
    passwordResetToken: hashed,
    passwordResetExpires: { $gt: new Date() },
  }).select("+passwordResetToken +passwordResetExpires");

  if (!user) throw ApiError.badRequest("This reset link is invalid or has expired");

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.passwordChangedAt = new Date();
  await user.save();

  emailService.sendPasswordChanged({ to: user.email, name: user.name }).catch(() => {});

  return sendAuthResponse(res, user, 200, "Password reset successfully");
});

/* =================== GET ALL SESSIONS (device list) ================ */
export const getSessions = asyncHandler(async (req, res) => {
  return ApiResponse.ok(res, {
    current: {
      userAgent: req.headers["user-agent"]?.slice(0, 120),
      ip: req.ip,
      issuedAt: new Date().toISOString(),
    },
    note: "JWT is stateless — signing out clears the cookie. To revoke everywhere, change your password.",
  });
});

export default { register, login, logout, getMe, updatePassword, forgotPassword, resetPassword, verifyResetToken, getSessions };
