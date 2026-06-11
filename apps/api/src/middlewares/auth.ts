import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createError } from './errorHandler';

export interface JwtPayload {
  id: string;
  email: string;
  rol: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(createError('Token requerido', 401));
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    next(createError('Token inválido o expirado', 401));
  }
}

// Debe usarse SIEMPRE después de requireAuth (necesita req.user)
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (req.user?.rol !== 'ADMIN') {
    return next(createError('Acceso solo para administradores', 403));
  }
  next();
}
