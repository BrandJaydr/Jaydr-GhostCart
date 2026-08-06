import { NextResponse } from 'next/server';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

export function apiSuccess<T>(data: T, pagination?: PaginationMeta, status = 200) {
  return NextResponse.json(
    {
      status: 'success',
      data,
      ...(pagination ? { pagination } : {}),
    },
    { status },
  );
}

export function apiError(error: string, details?: unknown, status = 400) {
  return NextResponse.json(
    {
      status: 'error',
      error,
      ...(details ? { details } : {}),
    },
    { status },
  );
}
