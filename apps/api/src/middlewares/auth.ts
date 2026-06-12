import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
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

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(createError('Token requerido', 401));
  }

  const token = header.slice(7);

  let payload: JwtPayload & { iat?: number };
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload & { iat?: number };
  } catch {
    return next(createError('Token inválido o expirado', 401));
  }

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.id },
      select: { passwordChangedAt: true },
    });
    // Cuenta eliminada → el token deja de valer al instante.
    if (!usuario) return next(createError('Token inválido o expirado', 401));

    // Token emitido ANTES del último cambio de contraseña → sesión inválida.
    // 1s de tolerancia: el `iat` del JWT está en segundos (redondeado), passwordChangedAt en ms.
    if (
      usuario.passwordChangedAt &&
      payload.iat != null &&
      payload.iat * 1000 < usuario.passwordChangedAt.getTime() - 1000
    ) {
      return next(createError('Sesión cerrada por cambio de contraseña. Iniciá sesión de nuevo.', 401));
    }

    req.user = payload;
    next();
  } catch (err) {
    next(err); // Error de DB → 500 real, no enmascararlo como token inválido.
  }
}

// Debe usarse SIEMPRE después de requireAuth (necesita req.user)
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (req.user?.rol !== 'ADMIN') {
    return next(createError('Acceso solo para administradores', 403));
  }
  next();
}
