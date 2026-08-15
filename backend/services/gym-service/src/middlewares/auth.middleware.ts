import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { JwtPayload, UserRole } from '../../../../shared/types';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

const accessSecret: string = process.env.JWT_ACCESS_SECRET ?? '';

if (!accessSecret) {
  throw new Error('JWT_ACCESS_SECRET is not set');
}

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction,
): Response | void => {
  const authorizationHeader: string | undefined = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token: string = authorizationHeader.replace('Bearer ', '').trim();

  try {
    const decoded: JwtPayload = jwt.verify(token, accessSecret) as JwtPayload;
    req.user = decoded;
    return next();
  } catch (error: unknown) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): Response | void => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return next();
  };
};
