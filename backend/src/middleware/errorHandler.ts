import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
}

export class HttpError extends Error implements AppError {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode >= 500 ? 'error' : 'fail';
    this.isOperational = true;
    Object.setPrototypeOf(this, HttpError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log errors in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error:', {
      message: err.message,
      statusCode,
      stack: err.stack,
    });
  } else if (statusCode >= 500) {
    console.error('Server Error:', err.message);
  }

  res.status(statusCode).json({
    success: false,
    error: statusCode >= 500 && process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : message,
    ...(process.env.NODE_ENV !== 'production' && statusCode >= 500 && {
      stack: err.stack,
    }),
  });
}

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction): void {
  const err = new HttpError('Resource not found', 404);
  next(err);
}
