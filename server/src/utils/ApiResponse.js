/* Uniform success/error envelopes for every API response. */

export class ApiError extends Error {
  constructor(statusCode, message, errors = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg = "Bad request", errors) { return new ApiError(400, msg, errors); }
  static unauthorized(msg = "Not authenticated") { return new ApiError(401, msg); }
  static forbidden(msg = "You do not have permission to perform this action") { return new ApiError(403, msg); }
  static notFound(msg = "Resource not found") { return new ApiError(404, msg); }
  static conflict(msg = "Resource already exists") { return new ApiError(409, msg); }
  static unprocessable(msg = "Validation failed", errors) { return new ApiError(422, msg, errors); }
  static tooMany(msg = "Too many requests, please slow down") { return new ApiError(429, msg); }
  static server(msg = "Something went wrong") { return new ApiError(500, msg); }
}

export class ApiResponse {
  constructor(res, statusCode, { data = null, message, meta } = {}) {
    const body = { success: statusCode < 400 };
    if (data !== null && data !== undefined) body.data = data;
    if (message) body.message = message;
    if (meta) body.meta = meta;
    return res.status(statusCode).json(body);
  }

  static ok(res, data, message, meta) { return new ApiResponse(res, 200, { data, message, meta }); }
  static created(res, data, message, meta) { return new ApiResponse(res, 201, { data, message, meta }); }
  static noContent(res) { return res.status(204).json({ success: true }); }
}

/** Wraps an async controller so rejected promises reach the error middleware. */
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Builds a pagination object shared by all list endpoints. */
export const paginate = ({ page = 1, limit = 12, total }) => {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));
  return { page: p, limit: l, pages: Math.max(1, Math.ceil(total / l)), total, skip: (p - 1) * l };
};

export default ApiResponse;
