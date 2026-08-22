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

/** Approve a reviewed product (review-before-use gate → 'approved'). Body may be empty. */
export const ProductApproveSchema = z.object({
  idempotencyKey: z.string().optional(),
});

/** Trigger a background refresh of an imported product from its supplier feed. */
export const ProductRefreshSchema = z.object({
  idempotencyKey: z.string().optional(),
});

export const ListingUpdateSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }).optional(),
  description: z.string().min(1, { message: 'Description is required' }).optional(),
  listPriceCents: z.number().int().min(0, { message: 'Price must be non-negative' }).optional(),
  currency: z.string().length(3, { message: 'Currency must be ISO 4217 3-letter code' }).optional(),
  attributes: z.record(z.unknown()).optional(),
  shipping: z.record(z.unknown()).optional(),
  imageUrls: z.array(z.string().url()).optional(),
});

export type ProductListQuery = z.infer<typeof ProductListQuerySchema>;
export type ListingListQuery = z.infer<typeof ListingListQuerySchema>;
export type ProductImportInput = z.infer<typeof ProductImportSchema>;
export type ListingCreateInput = z.infer<typeof ListingCreateSchema>;
export type ListingUpdateInput = z.infer<typeof ListingUpdateSchema>;

// ─── Auth (public self-service) ────────────────────────────────────────────────

export const SignupSchema = z.object({
  email: z.string().email({ message: 'Enter a valid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  name: z.string().min(1).max(120).optional(),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Enter a valid email address' }),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, { message: 'Reset token is required' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
});

export type SignupInput = z.infer<typeof SignupSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
