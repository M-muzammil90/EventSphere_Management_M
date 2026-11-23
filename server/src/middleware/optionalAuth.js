import { Router } from "express";
import { verifyToken } from "../utils/generateToken.js";
import User from "../models/User.js";

/**
 * optionalAuth — attaches req.user when a valid token is present but never
 * rejects the request. Used for public endpoints that personalise their
 * response for signed-in users (e.g. "myRegistration" on an expo detail).
 */
export const optionalAuth = async (req, _res, next) => {
  try {
    let token = req.cookies?.[process.env.JWT_COOKIE_NAME || "es_token"];
    const header = req.headers.authorization;
    if (!token && header?.startsWith("Bearer ")) token = header.slice(7);
    if (!token) return next();

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);
    if (user && user.isActive) req.user = user;
    next();
  } catch {
    next(); // anonymous continues
  }
};

export const protect = async (req, res, next) => {
  try {
    let token = req.cookies?.[process.env.JWT_COOKIE_NAME || "es_token"];
    const header = req.headers.authorization;
    if (!token && header?.startsWith("Bearer ")) token = header.slice(7);

    if (!token) return res.status(401).json({ success: false, message: "Not authenticated — please sign in" });

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select("+passwordChangedAt");
    if (!user) return res.status(401).json({ success: false, message: "The account for this session no longer exists" });
    if (!user.isActive) return res.status(403).json({ success: false, message: "This account has been deactivated" });
    if (user.passwordChangedAt) {
      const changedAt = Math.floor(user.passwordChangedAt.getTime() / 1000);
      if (decoded.iat < changedAt) return res.status(401).json({ success: false, message: "Password recently changed — please sign in again" });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: err.message || "Authentication failed" });
  }
};

export default optionalAuth;
