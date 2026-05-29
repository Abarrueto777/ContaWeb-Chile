import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  status?: number;
  details?: Record<string, string[]> | undefined;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = err.status ?? 500;
  const isProd = process.env['NODE_ENV'] === 'production';

  // En producción nunca exponer mensajes de errores internos
  const message = status >= 500 && isProd
    ? 'Error interno del servidor'
    : err.message || 'Error interno del servidor';

  res.status(status).json({
    error: message,
    ...(err.details ? { details: err.details } : {}),
    ...(!isProd && status >= 500 && err.stack ? { stack: err.stack } : {}),
  });
}

export function createError(message: string, status = 500, details?: Record<string, string[]>): AppError {
  const err: AppError = new Error(message);
  err.status = status;
  if (details !== undefined) err.details = details;
  return err;
}
