import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types/index';

/**
 * Middleware: Verify JWT Bearer token.
 * Attaches decoded payload to req.user.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Authorization header missing or malformed' });
    return;
  }

  const token = authHeader.slice(7); // Remove "Bearer "
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    res.status(500).json({ success: false, error: 'Server misconfiguration: JWT_SECRET not set' });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, error: 'Token expired. Please log in again.' });
    } else if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ success: false, error: 'Invalid token.' });
    } else {
      res.status(401).json({ success: false, error: 'Authentication failed.' });
    }
  }
}

/**
 * Middleware: Require the authenticated user to have the ADMIN role.
 * Must be used after `authenticate`.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'ADMIN') {
    res.status(403).json({ success: false, error: 'Forbidden: Admin access required.' });
    return;
  }
  next();
}

/**
 * Middleware: Optional authentication — attaches user if token present, but does
 * not reject the request if missing.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const secret = process.env.JWT_SECRET;

  if (authHeader && authHeader.startsWith('Bearer ') && secret) {
    try {
      const token = authHeader.slice(7);
      req.user = jwt.verify(token, secret) as JwtPayload;
    } catch {
      // Silently ignore invalid/expired tokens in optional auth
    }
  }
  next();
}
