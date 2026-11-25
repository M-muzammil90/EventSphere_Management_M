import User from "../models/User.js";
import RevokedToken from "../models/RevokedToken.js";
import { verifyToken, hashToken } from "../utils/generateToken.js";
import { ApiError } from "../utils/ApiResponse.js";

/**
 * Verifies the HttpOnly JWT cookie (or Authorization: Bearer header for
 * non-browser clients) and attaches the hydrated user to req.user.
 */
export const protect = async (req, _res, next) => {
  try {
    let token = req.cookies?.[process.env.JWT_COOKIE_NAME || "es_token"];

    const header = req.headers.authorization;
    if (!token && header?.startsWith("Bearer ")) token = header.slice(7);

    if (!token) throw ApiError.unauthorized("Not authenticated — please sign in");

    const decoded = verifyToken(token);

    // Check token revocation list (populated on logout)
    const revoked = await RevokedToken.exists({ tokenHash: hashToken(token) });
    if (revoked) throw ApiError.unauthorized("Session has been revoked — please sign in again");

    const user = await User.findById(decoded.id).select("+passwordChangedAt");

    if (!user) throw ApiError.unauthorized("The account for this session no longer exists");
    if (!user.isActive) throw ApiError.forbidden("This account has been deactivated");

    // Invalidate tokens issued before a password change
    if (user.passwordChangedAt) {
      const changedAt = Math.floor(user.passwordChangedAt.getTime() / 1000);
      if (decoded.iat < changedAt) throw ApiError.unauthorized("Password recently changed — please sign in again");
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/** Public-only guard (e.g. login/register). */
export const ifAuthenticated = (req, _res, next) => {
  try {
    const token = req.cookies?.[process.env.JWT_COOKIE_NAME || "es_token"] || req.headers.authorization?.slice(7);
    if (token) verifyToken(token);
    next();
  } catch {
    next(); // invalid token on a public route is not fatal
  }
};

/** Optional authentication — populates req.user if a valid token is present, but does not block guests. */
export const optionalProtect = async (req, _res, next) => {
  try {
    let token = req.cookies?.[process.env.JWT_COOKIE_NAME || "es_token"];
    const header = req.headers.authorization;
    if (!token && header?.startsWith("Bearer ")) token = header.slice(7);
    if (!token) return next();

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select("+passwordChangedAt");
    if (user && user.isActive) {
      req.user = user;
    }
    next();
  } catch {
    next();
  }
};

export default protect;
