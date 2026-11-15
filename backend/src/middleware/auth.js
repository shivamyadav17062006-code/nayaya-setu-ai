import jwt from 'jsonwebtoken';

/**
 * Middleware: Verify JWT Bearer token.
 * Attaches decoded payload to req.user.
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authorization header missing or malformed' });
  }

  const token = authHeader.slice(7);
  const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

  if (!secret) {
    return res.status(500).json({ success: false, error: 'Server misconfiguration: JWT_SECRET not set' });
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.user = {
      ...decoded,
      id: decoded.userId || decoded.id,
      userId: decoded.userId || decoded.id,
    };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ success: false, error: 'Token expired. Please log in again.' });
    } else if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ success: false, error: 'Invalid token.' });
    } else {
      return res.status(401).json({ success: false, error: 'Authentication failed.' });
    }
  }
}

/**
 * Middleware: Require the authenticated user to have the ADMIN role.
 */
export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, error: 'Forbidden: Admin access required.' });
  }
  next();
}

/**
 * Middleware: Optional authentication.
 */
export function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization;
  const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

  if (authHeader && authHeader.startsWith('Bearer ') && secret) {
    try {
      const token = authHeader.slice(7);
      const decoded = jwt.verify(token, secret);
      req.user = {
        ...decoded,
        id: decoded.userId || decoded.id,
        userId: decoded.userId || decoded.id,
      };
    } catch {
      // Silently ignore invalid/expired tokens in optional auth
    }
  }
  next();
}
