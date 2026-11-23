import { ApiError, asyncHandler } from "../utils/ApiResponse.js";

/**
 * Runs a Zod schema against req.body (and optionally params/query), then
 * replaces them with the coerced, type-safe result.
 *
 *   router.post("/", validate(authValidator.register), controller)
 */
export const validate =
  ({ body, params, query } = {}) =>
  asyncHandler(async (req, _res, next) => {
    const issues = [];

    for (const [schema, target] of [
      [body, "body"],
      [params, "params"],
      [query, "query"],
    ]) {
      if (!schema) continue;
      const result = schema.safeParse(req[target]);
      if (!result.success) {
        issues.push(...result.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })));
      } else {
        req[target] = result.data;
      }
    }

    if (issues.length) throw ApiError.unprocessable("Validation failed", issues);
    next();
  });

export default validate;
