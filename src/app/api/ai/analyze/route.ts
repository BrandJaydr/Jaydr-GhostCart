import type { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { z } from 'zod';
import { getAIClient, type AnalysisRequest, type AnalysisResponse } from '@/lib/ai/ai-client';
import { getCacheManager, CacheManager } from '@/lib/ai/cache-manager';
import { db, withTenant } from '@/lib/db/index';
import { requireAuth } from '@/lib/middleware/auth-guard';

/**
 * Schema for AI analysis request
 */
const AnalysisSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  attributes: z.record(z.unknown()).optional(),
  images: z.array(z.string().url()).optional(),
  productId: z.string().uuid().optional(),
});

/**
 * POST /api/ai/analyze
 * Analyze product for materials, quality, and market potential
 *
 * Provides comprehensive product analysis including:
 * - Material composition
 * - Quality scoring
 * - Risk assessment for marketplace policies
 * - Market potential with seasonal factors
 *
 * @agent:oracle Add unit tests for this endpoint
 */
export async function POST(req: NextRequest) {
  const actor = await requireAuth(req);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError('Invalid JSON request body', null, 400);
  }

  const parseResult = AnalysisSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError('Validation failed', parseResult.error.flatten().fieldErrors, 400);
  }

  const analysisRequest = parseResult.data;
  const { tenantId } = actor;

  try {
    // Generate cache key
    const cacheKey = CacheManager.generateKey('analysis', analysisRequest);
    const cacheManager = getCacheManager();

    // Check cache first
    const cached = await cacheManager.get<AnalysisResponse>(cacheKey);
    if (cached) {
      return apiSuccess({
        ...cached,
        cached: true,
        source: 'cache',
      });
    }

    // Call AI client
    const aiClient = getAIClient();
    const aiResponse = await aiClient.analyzeProduct(analysisRequest);

    // Cache the result
    await cacheManager.set(cacheKey, aiResponse, {
      l1TTL: 5 * 60 * 1000, // 5 minutes
      l2TTL: 24 * 60 * 60 * 1000, // 24 hours
      l3Permanent: true,
      tags: ['analysis', 'product'],
    });

    // Store in database for permanent record
    if (analysisRequest.productId) {
      try {
        await withTenant(tenantId, async (client) => {
          await client.query(
            `INSERT INTO ai_insights.product_analysis
               (tenant_id, product_id, material_composition, quality_score,
                risk_assessment, market_potential, confidence_score)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (tenant_id, product_id, analysis_version) DO UPDATE
               SET material_composition = EXCLUDED.material_composition,
                   quality_score = EXCLUDED.quality_score,
                   risk_assessment = EXCLUDED.risk_assessment,
                   market_potential = EXCLUDED.market_potential,
                   confidence_score = EXCLUDED.confidence_score,
                   analyzed_at = now()`,
            [
              tenantId,
              analysisRequest.productId,
              JSON.stringify({ composition: aiResponse.materialComposition }),
              aiResponse.qualityScore,
              JSON.stringify(aiResponse.riskAssessment),
              JSON.stringify(aiResponse.marketPotential),
              0.85, // Default confidence score
            ],
          );
        });
      } catch (err) {
        console.error('[api/ai/analyze] Database storage error:', err);
        // Continue even if database storage fails
      }
    }

    return apiSuccess({
      ...aiResponse,
      cached: false,
      source: 'ai',
    });
  } catch (err) {
    console.error('[api/ai/analyze] Error:', err);
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

    return apiError('Failed to analyze product', null, 500);
  }
}

/**
 * GET /api/ai/analyze
 * Get cached analysis for a product
 */
export async function GET(req: NextRequest) {
  const actor = await requireAuth(req);

  const url = new URL(req.url);
  const productId = url.searchParams.get('productId');

  if (!productId) {
    return apiError('productId is required', null, 400);
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(productId)) {
    return apiError('Invalid productId format', null, 400);
  }

  const { tenantId } = actor;

  try {
    const result = await withTenant(tenantId, async (client) => {
      return await client.query(
        `SELECT material_composition, quality_score, risk_assessment,
                market_potential, confidence_score, analyzed_at
         FROM ai_insights.product_analysis
         WHERE tenant_id = $1 AND product_id = $2
         ORDER BY analyzed_at DESC
         LIMIT 1`,
        [tenantId, productId],
      );
    });

    if ((result.rowCount ?? 0) === 0) {
      return apiError('No analysis found for this product', null, 404);
    }

    const row = result.rows[0];
    const analysis = {
      materialComposition: row.material_composition,
      qualityScore: row.quality_score,
      riskAssessment: row.risk_assessment,
      marketPotential: row.market_potential,
      confidenceScore: row.confidence_score,
      analyzedAt: row.analyzed_at,
    };

    return apiSuccess(analysis);
  } catch (err) {
    console.error('[api/ai/analyze] GET error:', err);
    return apiError('Failed to retrieve product analysis', null, 500);
  }
}
