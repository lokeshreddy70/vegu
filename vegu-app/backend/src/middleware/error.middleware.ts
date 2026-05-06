import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { sendError } from '../utils/response';
import { logger } from '../utils/logger';

export const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof ZodError) {
    sendError(res, 'Validation failed', 422, err.flatten().fieldErrors);
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      sendError(res, 'A record with this value already exists', 409);
      return;
    }
    if (err.code === 'P2025') {
      sendError(res, 'Record not found', 404);
      return;
    }
    logger.error('Prisma error', { code: err.code, meta: err.meta, url: req.originalUrl });
    sendError(res, 'Database error', 500);
    return;
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    logger.error('Prisma validation error', { message: err.message });
    sendError(res, 'Invalid data provided', 400);
    return;
  }

  if (err instanceof Error) {
    const status = (err as Error & { statusCode?: number }).statusCode ?? 500;
    if (status >= 500) {
      logger.error('Unhandled error', { message: err.message, stack: err.stack, url: req.originalUrl, method: req.method });
    }
    sendError(res, status >= 500 ? 'Internal server error' : err.message, status);
    return;
  }

  logger.error('Unknown error type', { err, url: req.originalUrl });
  sendError(res, 'Internal server error', 500);
};

export const notFound = (req: Request, res: Response): void => {
  sendError(res, `Route ${req.method} ${req.path} not found`, 404);
};
