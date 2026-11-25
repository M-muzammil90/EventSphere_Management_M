import rateLimit from "express-rate-limit";

const isDev = process.env.NODE_ENV === "development";
const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10);
const max = parseInt(process.env.RATE_LIMIT_MAX || (isDev ? "2000" : "300"), 10);
const authMax = parseInt(process.env.AUTH_RATE_LIMIT_MAX || (isDev ? "200" : "20"), 10);

const message = { success: false, message: "Too many requests from this IP — please try again later" };

/** Global API limiter. */
export const apiLimiter = rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false, message });

/** Stricter limiter for login / register / forgot-password. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: authMax,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, message: "Too many authentication attempts — please wait 15 minutes" },
});

/** Very strict limiter for password reset requests. */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many password reset requests — please try again in an hour" },
});

/** Moderate limiter for write operations. */
export const writeLimiter = rateLimit({
  windowMs,
  max: Math.floor(max / 3),
  standardHeaders: true,
  legacyHeaders: false,
  message,
});

export default apiLimiter;
