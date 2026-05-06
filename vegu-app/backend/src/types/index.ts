import { Role } from '@prisma/client';
import { Request } from 'express';

export interface AuthPayload {
  userId: string;
  role: Role;
  email: string;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProductQuery extends PaginationQuery {
  category?: string;
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  featured?: string;
  trending?: string;
  vendorId?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
