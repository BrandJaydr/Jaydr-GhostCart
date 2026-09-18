import type { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { z } from 'zod';
import { getAIClient } from '@/lib/ai/ai-client';
import { getCacheManager, CacheManager } from '@/lib/ai/cache-manager';
import { withAuthRoute, requirePermission, Permission } from '@/lib/middleware/auth-guard';

/**
 * Schema for AI rewrite request
 */
const RewriteSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  marketplace: z.string().optional(),
  style: z.enum(['emotional', 'luxury', 'budget', 'premium', 'neutral']).optional(),
  keywords: z.array(z.string()).optional(),
  productId: z.string().uuid().optional(),
  listingId: z.string().uuid().optional(),
});

/**
 * POST /api/ai/rewrite
 * Generate AI-assisted listing rewrite
 *
 * Preserves original content and requires user review before applying.
 * Uses multi-level caching (L1/L2/L3) to reduce AI API costs.
 *
 * @agent:oracle Add unit tests for this endpoint
 */
export const POST = withAuthRoute(async (req: NextRequest, actor) => {
  await requirePermission(actor, Permission.LISTINGS_WRITE);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError('Invalid JSON request body', null, 400);
  }

  const parseResult = RewriteSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError('Validation failed', parseResult.error.flatten().fieldErrors, 400);
  }

  const rewriteRequest = parseResult.data;

  try {
    // Generate cache key
    const cacheKey = CacheManager.generateKey('rewrite', rewriteRequest);
    const cacheManager = getCacheManager();

    // Check cache first
    const cached = await cacheManager.get(cacheKey);
    if (cached) {
      return apiSuccess({
        ...cached,
        cached: true,
        source: 'cache',
      });
    }

    // Call AI client
    const aiClient = getAIClient();
    const aiResponse = await aiClient.rewriteListing(rewriteRequest);

    // Cache the result
    await cacheManager.set(cacheKey, aiResponse, {
      l1TTL: 5 * 60 * 1000, // 5 minutes
      l2TTL: 24 * 60 * 60 * 1000, // 24 hours
      l3Permanent: true,
      tags: ['rewrite', rewriteRequest.marketplace || 'general'],
    });

    // Store in database for permanent record
    try {
      await cacheManager.set(cacheKey, aiResponse);
    } catch (err) {
      console.error('[api/ai/rewrite] Database cache error:', err);
      // Continue even if database cache fails
    }

    return apiSuccess({
      ...aiResponse,
      cached: false,
      source: 'ai',
    });
  } catch (err) {
    console.error('[api/ai/rewrite] Error:', err);
    const errorMessage = (err as Error).message;

    // Provide helpful error messages
    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('fetch failed')) {
      return apiError(
        'AI service unavailable. Please check that Ollama/vLLM is running.',
        { hint: 'Run: ollama serve' },
        503,
      );
    }

    if (errorMessage.includes('timeout')) {
      return apiError('AI service timeout. Please try again.', null, 504);
    }

    return apiError('Failed to generate AI rewrite', null, 500);
  }
});

/**
 * GET /api/ai/rewrite
 * Get cached rewrite for a product or listing
 */
export const GET = withAuthRoute(async (req: NextRequest, actor) => {
  await requirePermission(actor, Permission.LISTINGS_READ);

  const url = new URL(req.url);
  const productId = url.searchParams.get('productId');
  const listingId = url.searchParams.get('listingId');

  if (!productId && !listingId) {
    return apiError('Either productId or listingId is required', null, 400);
  }

  try {
    const cacheManager = getCacheManager();

    // Query database for cached suggestions
    const result = await cacheManager.get(
      CacheManager.generateKey('rewrite', { productId, listingId }),
    );

    if (!result) {
      return apiError('No cached rewrite found', null, 404);
    }

    return apiSuccess(result);
  } catch (err) {
    console.error('[api/ai/rewrite] GET error:', err);
    return apiError('Failed to retrieve cached rewrite', null, 500);
  }
});
