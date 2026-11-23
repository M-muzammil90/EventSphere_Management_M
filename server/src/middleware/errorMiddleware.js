import { ApiError } from "../utils/ApiResponse.js";

export const notFound = (req, _res, next) =>
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));

/* eslint-disable no-unused-vars */
export const errorHandler = (err, req, res, _next) => {
  let error = err;

  // Mongoose: bad ObjectId
  if (err.name === "CastError") {
    error = ApiError.badRequest(`Invalid ${err.path}: ${err.value}`);
  }
  // Mongoose: duplicate key
  else if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    const value = err.keyValue?.[field];
    const msgs = {
      email: "An account with this email already exists",
      slug: "An expo with this slug already exists",
    };
    error = ApiError.conflict(msgs[field] ?? `Duplicate value for ${field}: ${value}`);
  }
  // Mongoose: schema validation
  else if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    error = ApiError.unprocessable("Validation failed", errors);
  }
  // Zod validation shape
  else if (err?.name === "ZodError" || Array.isArray(err?.issues)) {
    const errors = (err.issues || []).map((i) => ({ field: i.path?.join("."), message: i.message }));
    error = ApiError.unprocessable("Validation failed", errors);
  }
  // Multer
  else if (err?.code === "LIMIT_FILE_SIZE") {
    error = ApiError.badRequest("File too large — maximum allowed size exceeded");
  }

  const statusCode = error.statusCode || 500;
  const isProd = process.env.NODE_ENV === "production";

  // Never leak internals in production
  const message = statusCode >= 500 && isProd ? "Something went wrong" : error.message || "Server error";

  if (statusCode >= 500) {
    console.error("💥", {
      message: err.message,
      stack: isProd ? undefined : err.stack,
      path: req.originalUrl,
      method: req.method,
      body: req.body,
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(error.errors ? { errors: error.errors } : {}),
    ...(!isProd && statusCode >= 500 ? { stack: err.stack } : {}),
  });
};

export default errorHandler;
