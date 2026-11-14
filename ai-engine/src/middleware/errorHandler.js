/**
 * Centralized error handler for the AI microservice.
 * Ensures consistent response format and shields sensitive tokens.
 */
export function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || err.status || 500;
  const isDev = process.env.NODE_ENV === 'development';

  console.error(`[AI Engine Error] ${req.method} ${req.path}:`, {
    message: err.message,
    code: err.code,
    stack: isDev ? err.stack : undefined,
  });

  res.status(statusCode).json({
    detail: statusCode >= 500 ? 'An internal AI engine error occurred.' : err.message,
    code: err.code || 'AI_ENGINE_ERROR',
    ...(isDev && statusCode >= 500 ? { debug: { stack: err.stack } } : {}),
  });
}

export default errorHandler;
