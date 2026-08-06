import { z } from 'zod';

// ─── Query Pagination & Filtering ─────────────────────────────────────────────

export const ProductListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  category: z.string().optional(),
  supplierId: z.string().optional(),
});

export const ListingListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  state: z
    .enum(['draft', 'ready_for_review', 'queued', 'submitted', 'published', 'failed'])
    .optional(),
});

// ─── Mutation Request Bodies ──────────────────────────────────────────────────

export const ProductImportSchema = z.object({
  url: z.string().url({ message: 'Must be a valid HTTP or HTTPS supplier URL' }),
  supplierId: z.string().min(1, { message: 'Supplier ID is required' }),
  idempotencyKey: z.string().min(1, { message: 'Idempotency key is required' }),
});

export const ListingCreateSchema = z.object({
  productId: z.string().min(1, { message: 'Product ID is required' }),
  marketplace: z.string().min(1, { message: 'Marketplace identifier is required' }),
  idempotencyKey: z.string().optional(),
});

export type ProductListQuery = z.infer<typeof ProductListQuerySchema>;
export type ListingListQuery = z.infer<typeof ListingListQuerySchema>;
export type ProductImportInput = z.infer<typeof ProductImportSchema>;
export type ListingCreateInput = z.infer<typeof ListingCreateSchema>;
