import { ApiError } from "../utils/ApiResponse.js";

const ADMIN_ROLES = ["admin", "organizer"];

/** Allow only the listed roles. Usage: router.post("/", protect, restrictTo("admin"), fn) */
export const restrictTo = (...roles) => (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  const role = req.user.role;
  // admin and organizer share the management surface
  if (roles.some((r) => (r === "admin" ? ADMIN_ROLES.includes(role) : r === role))) return next();
  return next(ApiError.forbidden(`This action requires one of: ${roles.join(", ")}`));
};

export const isAdmin = (user) => ADMIN_ROLES.includes(user?.role);

/**
 * Ownership guard — a user may only touch their own record unless they are
 * an admin. Enforced at the API layer AND re-checked inside controllers at
 * the database query level (defence in depth).
 */
export const requireOwnership = (getOwnerId) => (req, _res, next) => {
  if (isAdmin(req.user)) return next();
  const ownerId = typeof getOwnerId === "function" ? getOwnerId(req) : getOwnerId;
  if (String(ownerId) === String(req.user._id)) return next();
  return next(ApiError.forbidden("You can only access your own records"));
};

/** Blocks public self-promotion to Admin during registration. */
export const assertPublicRegisterableRole = (role) => {
  if (ADMIN_ROLES.includes(role)) {
    throw ApiError.forbidden(
      "Admin/Organizer accounts cannot be created through public registration. They are provisioned by the system owner."
    );
  }
};

export default restrictTo;
