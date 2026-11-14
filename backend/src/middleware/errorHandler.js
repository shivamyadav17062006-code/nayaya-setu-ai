import { ZodError } from 'zod';

/**
 * Global Express error handler.
 * Catches errors forwarded via next(err) from any route or middleware.
 * Ensures consistent response format and shields sensitive database details.
 */
export function errorHandler(err, req, res, _next) {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Handle Prisma unique constraint violations (e.g. duplicate email/phone/session)
  if (err.code === 'P2002') {
    const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'field';
    return res.status(409).json({
      success: false,
      error: `A record with this ${target} already exists.`,
      code: 'DUPLICATE_RESOURCE',
    });
  }

  // Handle Prisma record not found
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: 'Requested resource was not found.',
      code: 'NOT_FOUND',
    });
  }

  const statusCode = err.statusCode ?? (err.status ?? 500);
  const isDev = process.env.NODE_ENV === 'development';

  if (statusCode >= 500) {
    console.error(`[ERROR] ${req.method} ${req.path}`, {
      message: err.message,
      stack: err.stack,
      code: err.code,
    });
  } else {
    console.warn(`[WARN] ${req.method} ${req.path} — ${err.message}`);
  }

  res.status(statusCode).json({
    success: false,
    error: statusCode >= 500 ? 'An internal server error occurred.' : err.message,
    code: err.code || (statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_ERROR'),
    ...(isDev && statusCode >= 500 ? { debug: { stack: err.stack, code: err.code } } : {}),
  });
}

/**
 * Factory: Create an AppError with a specific HTTP status code and error code.
 */
export function createError(message, statusCode = 500, code) {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
}
