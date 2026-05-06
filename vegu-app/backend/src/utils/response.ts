import { Response } from 'express';

export const sendSuccess = <T>(res: Response, data: T, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

export const sendError = (res: Response, message: string, statusCode = 400, errors?: unknown) => {
  const body: Record<string, unknown> = { success: false, message };
  if (errors !== undefined) body.errors = errors;
  res.status(statusCode).json(body);
};

export const sendPaginated = <T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  message = 'Success'
) =>
  res.status(200).json({
    success: true,
    message,
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
