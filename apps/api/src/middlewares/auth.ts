import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { createError } from './errorHandler';
import { getEstadoSuscripcion } from '../services/suscripcion.service';

export interface JwtPayload {
  id: string;
  email: string;
  rol: string;
}

export interface SuscripcionInfo {
  trialFin: Date | null;
  suscripcionHasta: Date | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      suscripcion?: SuscripcionInfo;
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
      select: { estado: true, passwordChangedAt: true, trialFin: true, suscripcionHasta: true },
    });
    // Cuenta eliminada → el token deja de valer al instante.
    if (!usuario) return next(createError('Token inválido o expirado', 401));

    // Cuenta suspendida → el token deja de valer al instante (no solo en el login).
    if (usuario.estado === 'SUSPENDIDO') {
      return next(createError('Tu cuenta está suspendida. Contacta al administrador.', 403));
    }

    // Token emitido ANTES del último cambio de contraseña → sesión inválida.
    // 1s de tolerancia: el `iat` del JWT está en segundos (redondeado), passwordChangedAt en ms.
    if (
      usuario.passwordChangedAt &&
      payload.iat != null &&
      payload.iat * 1000 < usuario.passwordChangedAt.getTime() - 1000
    ) {
      return next(createError('Sesión cerrada por cambio de contraseña. Inicia sesión de nuevo.', 401));
    }

    req.user = payload;
    // Aprovecha esta misma consulta para que requireSuscripcion no haga otra.
    req.suscripcion = { trialFin: usuario.trialFin, suscripcionHasta: usuario.suscripcionHasta };
    next();
  } catch (err) {
    next(err); // Error de DB → 500 real, no enmascararlo como token inválido.
  }
}

// Bloquea el acceso al negocio cuando venció el trial y no hay suscripción vigente.
// Debe usarse SIEMPRE después de requireAuth (necesita req.user y req.suscripcion).
// 402 Payment Required: el frontend lo intercepta y redirige a /suscripcion.
export function requireSuscripcion(req: Request, _res: Response, next: NextFunction): void {
  if (req.user?.rol === 'ADMIN') return next();

  const { trialVigente, suscripcionVigente } = getEstadoSuscripcion({
    trialFin: req.suscripcion?.trialFin ?? null,
    suscripcionHasta: req.suscripcion?.suscripcionHasta ?? null,
  });

  if (!trialVigente && !suscripcionVigente) {
    return next(createError('Tu período de prueba terminó. Activa tu suscripción para seguir usando ContaCLWEB.', 402));
  }
  next();
}

// Debe usarse SIEMPRE después de requireAuth (necesita req.user)
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (req.user?.rol !== 'ADMIN') {
    return next(createError('Acceso solo para administradores', 403));
  }
  next();
}
