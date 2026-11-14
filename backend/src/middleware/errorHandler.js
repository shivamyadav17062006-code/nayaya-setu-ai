/**
 * Global Express error handler.
 * Catches errors forwarded via next(err) from any route or middleware.
 */
export function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode ?? 500;
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
    ...(isDev && statusCode >= 500
      ? { debug: { stack: err.stack, code: err.code } }
      : {}),
  });
}

/**
 * Factory: Create an AppError with a specific HTTP status code.
 */
export function createError(message, statusCode = 500, code) {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
}
