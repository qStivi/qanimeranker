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

export function optionalAuthMiddleware(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const token = req.cookies?.auth_token;

  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
      req.user = decoded;
    } catch {
      // Token invalid, continue without auth
    }
  }

  next();
}
