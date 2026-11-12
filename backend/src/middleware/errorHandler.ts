import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * Global Express error handler.
 * Catches errors forwarded via next(err) from any route or middleware.
 */
export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;
  const isDev = process.env.NODE_ENV === 'development';

  // Log the error
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
export function createError(message: string, statusCode = 500, code?: string): AppError {
  const err = new Error(message) as AppError;
  err.statusCode = statusCode;
  err.code = code;
  return err;
}
