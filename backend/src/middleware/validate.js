import { z } from 'zod';

/**
 * Higher-order middleware for Zod schema validation.
 * Validates request body, query params, or path params.
 *
 * @param {z.ZodSchema} schema - The Zod schema to validate against
 * @param {'body' | 'query' | 'params'} [source='body'] - The request property to validate
 */
export function validate(schema, source = 'body') {
  return async (req, res, next) => {
    try {
      const dataToValidate = req[source];
      const parsed = await schema.parseAsync(dataToValidate);
      req[source] = parsed;
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: err.errors.map((e) => ({
            field: e.path.join('.') || source,
            message: e.message,
          })),
        });
      }
      next(err);
    }
  };
}

export default validate;
