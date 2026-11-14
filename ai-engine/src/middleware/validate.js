import { ZodError } from 'zod';

export function validate(schema, source = 'body') {
  return async (req, res, next) => {
    try {
      const parsed = await schema.parseAsync(req[source]);
      req[source] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          detail: 'Validation failed',
          errors: err.errors.map((e) => ({
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
