import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { sendError } from '../utils/response';
import { AuthRequest } from '../types';

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    sendError(res, 'No token provided', 401);
    return;
  }
  try {
    const payload = verifyAccessToken(header.split(' ')[1]);
    req.user = payload;
    next();
  } catch {
    sendError(res, 'Invalid or expired token', 401);
  }
};

export const optionalAuth = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      req.user = verifyAccessToken(header.split(' ')[1]);
    } catch {
      // ignore — optional
    }
  }
  next();
};
