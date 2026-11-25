import crypto from "node:crypto";
import { ApiError } from "../utils/ApiResponse.js";

export const CSRF_COOKIE_NAME = "es_csrf";
export const CSRF_HEADER_NAME = "x-csrf-token";

export const csrfCookieOptions = () => ({
  httpOnly: false, // Must be readable by the SPA to echo in X-CSRF-Token header
  secure: process.env.JWT_COOKIE_SECURE === "true",
  sameSite: process.env.JWT_COOKIE_SAME_SITE || "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
});

export const generateCsrfToken = () => crypto.randomBytes(32).toString("hex");

export const setCsrfCookie = (res, existingToken) => {
  const token = existingToken || generateCsrfToken();
  res.cookie(CSRF_COOKIE_NAME, token, csrfCookieOptions());
  return token;
};

function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

const EXEMPT_PREFIXES = [
  "/api/v1/payments/webhook",
  "/api/v1/payments/webhooks",
  "/api/v1/auth/login",
  "/api/v1/auth/register",
  "/api/v1/auth/forgot-password",
  "/api/v1/auth/reset-password",
];

/**
 * Double-submit cookie + Origin validation CSRF protection.
 * Applies to state-changing requests (POST, PUT, PATCH, DELETE) that rely on
 * cookie authentication.
 */
export const csrfProtection = (req, _res, next) => {
  const method = req.method?.toUpperCase();
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return next();
  }

  if (EXEMPT_PREFIXES.some((p) => req.originalUrl?.startsWith(p))) {
    return next();
  }

  // Origin validation when Origin header is provided by a browser
  const origin = req.headers.origin;
  if (origin && process.env.NODE_ENV !== "test") {
    const allowed = (process.env.CORS_ORIGINS || process.env.CLIENT_URL || "http://localhost:5173")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (allowed.length > 0 && !allowed.includes(origin) && !origin.startsWith("http://localhost:") && !origin.startsWith("http://127.0.0.1:")) {
      return next(ApiError.forbidden("CSRF origin check failed"));
    }
  }

  const authCookie = req.cookies?.[process.env.JWT_COOKIE_NAME || "es_token"];
  const csrfCookie = req.cookies?.[CSRF_COOKIE_NAME];
  const csrfHeader = req.headers[CSRF_HEADER_NAME];

  // If authenticated via cookie (browser session), enforce double-submit CSRF token
  // In test mode, enforce when x-enforce-csrf is set or when an x-csrf-token header is supplied
  const shouldEnforce = process.env.NODE_ENV !== "test" || req.headers["x-enforce-csrf"] === "true" || csrfHeader !== undefined;
  if (authCookie && shouldEnforce && (csrfCookie || req.headers["x-enforce-csrf"] === "true")) {
    if (!csrfCookie || !csrfHeader || !safeEqual(String(csrfHeader), String(csrfCookie))) {
      return next(ApiError.forbidden("Invalid or missing CSRF token"));
    }
  }

  return next();
};
