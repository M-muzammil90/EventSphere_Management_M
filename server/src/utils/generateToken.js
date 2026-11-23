import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { ApiError } from "./ApiResponse.js";

const SECRET = () => {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) {
    throw ApiError.server("JWT_SECRET is missing or too short — set a value of at least 32 characters in .env");
  }
  return s;
};

/** Signed JWT access token. Kept stateless so the API scales horizontally. */
export const signToken = (payload, expiresIn = process.env.JWT_EXPIRES_IN || "7d") =>
  jwt.sign(payload, SECRET(), { expiresIn });

/** Throws a clean 401 on invalid/expired tokens. */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, SECRET());
  } catch (err) {
    const msg = err.name === "TokenExpiredError" ? "Session expired, please sign in again" : "Invalid authentication token";
    throw ApiError.unauthorized(msg);
  }
};

/** Random hex string — used for password reset tokens. */
export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString("hex");

/** SHA-256 hash so raw reset tokens are never persisted. */
export const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

/**
 * Cookie options for the HttpOnly JWT.
 * `secure` is only enabled behind HTTPS; SameSite=lax blocks CSRF for
 * cross-site POSTs while still allowing top-level navigation.
 */
export const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.JWT_COOKIE_SECURE === "true",
  sameSite: process.env.JWT_COOKIE_SAME_SITE || "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
});

export const clearCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.JWT_COOKIE_SECURE === "true",
  sameSite: process.env.JWT_COOKIE_SAME_SITE || "lax",
  path: "/",
});

export const cookieName = () => process.env.JWT_COOKIE_NAME || "es_token";
