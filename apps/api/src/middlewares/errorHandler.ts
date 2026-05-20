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
  res.status(status).json({
    error: err.message || 'Error interno del servidor',
    ...(err.details ? { details: err.details } : {}),
  });
}

export function createError(message: string, status = 500, details?: Record<string, string[]>): AppError {
  const err: AppError = new Error(message);
  err.status = status;
  if (details !== undefined) err.details = details;
  return err;
}
