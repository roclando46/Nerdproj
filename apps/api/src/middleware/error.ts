import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * Global error handler — must be registered last in the Express app.
 * Transforms all thrown errors into a consistent JSON shape.
 */
export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const statusCode = err.statusCode ?? 500;
  const message =
    statusCode >= 500 && env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message;

  if (statusCode >= 500) {
    console.error('[ERROR]', err);
  }

  res.status(statusCode).json({
    error: err.code ?? 'InternalServerError',
    message,
    statusCode,
  });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    error: 'NotFound',
    message: `Route ${_req.method} ${_req.path} not found`,
    statusCode: 404,
  });
}
