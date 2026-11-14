import type { NextFunction, Request, Response } from 'express';
import { HttpError } from './errors.js';

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.session?.adminId) return next(new HttpError(401, 'Administrator sign-in required.'));
  return next();
}
