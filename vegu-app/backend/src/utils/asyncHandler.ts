import { Request, Response, NextFunction } from 'express';

type AsyncFn = (req: Request, res: Response, next: NextFunction) => Promise<void>;

// Wraps an async Express handler so any thrown error (Zod, Prisma, etc.)
// is forwarded to the central errorHandler middleware instead of crashing silently.
export const asyncHandler = (fn: AsyncFn) =>
  (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
