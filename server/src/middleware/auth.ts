import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { AuthenticatedRequest, JWTPayload } from '../types/index.js';

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token = req.cookies?.auth_token;

  if (!token) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Optional authentication middleware.
 * Attaches user info to request if valid token present, otherwise continues anonymously.
 * This is intentional for routes that work with or without authentication.
 *
 * Security note (CodeQL js/user-controlled-bypass):
 * This middleware intentionally allows unauthenticated access. Routes using this middleware
 * MUST handle the case where req.user is undefined and not expose sensitive data.
 * For routes requiring authentication, use authMiddleware instead.
 */
export function optionalAuthMiddleware(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const token = req.cookies?.auth_token;

  // Explicitly clear any existing user state
  req.user = undefined;

  if (token && typeof token === 'string' && token.length > 0) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

      // Validate decoded payload has required fields
      if (decoded && typeof decoded.userId === 'number' && typeof decoded.anilistId === 'number') {
        req.user = decoded;
      }
    } catch {
      // Token invalid or expired - continue without auth (intentional)
      // Clear the invalid cookie to prompt re-login
      // Note: Cookie clearing handled by the route if needed
    }
  }

  next();
}
