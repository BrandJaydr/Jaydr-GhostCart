import type { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { z } from 'zod';
import { withAuthRoute } from '@/lib/middleware/auth-guard';

/**
 * Allowed MIME types for source image uploads
 */
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BASE64_SIZE = 10 * 1024 * 1024; // ~10MB decoded

/**
 * Schema for AI image generation request
 */
const GenerateImageSchema = z.object({
  sourceImage: z
    .string()
    .min(1, 'Source image is required')
    .refine(
      (val) => {
        // Accept either a valid URL or a base64 data URI
        if (val.startsWith('http://') || val.startsWith('https://')) return true;
        if (val.startsWith('data:image/')) {
          const mimeMatch = val.match(/^data:(image\/\w+);base64,/);
          if (!mimeMatch) return false;
          if (!ALLOWED_MIME_TYPES.includes(mimeMatch[1])) return false;
          // Check approximate decoded size from base64 length
          const base64Part = val.split(',')[1] || '';
          const estimatedBytes = (base64Part.length * 3) / 4;
          return estimatedBytes <= MAX_BASE64_SIZE;
        }
        return false;
      },
      {
        message:
          'Source image must be a valid URL or a base64 data URI (JPEG, PNG, or WebP, max 10MB)',
      },
    ),
  prompt: z
    .string()
    .min(1, 'Prompt is required')
    .max(2000, 'Prompt must be under 2000 characters'),
  style: z
    .enum(['product_photo', 'lifestyle', 'flat_lay', 'banner', 'social'])
    .optional()
    .default('product_photo'),
  aspectRatio: z
    .enum(['1:1', '4:3', '16:9', '9:16'])
    .optional()
    .default('1:1'),
  productId: z.string().uuid().optional(),
});

/**
 * Mock product images for demo mode.
 * In production, these would come from the actual AI provider response.
 */
const MOCK_GENERATED_IMAGES: Record<string, string> = {
  product_photo:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAB3MCwZBtiGF5cggkrgGllgUvjNErZh7kOWGIZdrctw2vvB5_OOFRnzXXv8lZDOw2KtU40sBvdEpvSmLqXBPYw_H2eEya67zeClkQxS5ApYXH5d-tnRADURrl6jSeyQc6xsrytYlQZRiMeWRQEACRSSgQQH4Y3dyCYPMQIPC9kcjwYmLYLKK5XdBpGI6KsH2wOmap2oCPHPsx3vMt_pC5IvcCb38NCpCPK0GN9vXQpyRq_GrwrHULv',
  lifestyle:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBO5psZxTit-LMh1v9yapeQFW36XYDOwnQON8k3B-sUDm-i8QwmtVtA6M7grmD9zflJ8VMqwve6BnzlYrMVR5X2Z2p0O8ATsdgAGnW5xAL-U86IuaBcsAIaGV4WK8DTJQUfb9vWK2A9J25kEVldTElQYqd8w6pqju1-P49Pc0cW93tuuwnEUVHlw7d1TkIrhizcxSoEjS2f58jjgviBNCB392G-qsoBXmeODKJ7V8P916PNj3kZPbxm',
  flat_lay:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAB3MCwZBtiGF5cggkrgGllgUvjNErZh7kOWGIZdrctw2vvB5_OOFRnzXXv8lZDOw2KtU40sBvdEpvSmLqXBPYw_H2eEya67zeClkQxS5ApYXH5d-tnRADURrl6jSeyQc6xsrytYlQZRiMeWRQEACRSSgQQH4Y3dyCYPMQIPC9kcjwYmLYLKK5XdBpGI6KsH2wOmap2oCPHPsx3vMt_pC5IvcCb38NCpCPK0GN9vXQpyRq_GrwrHULv',
  banner:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBO5psZxTit-LMh1v9yapeQFW36XYDOwnQON8k3B-sUDm-i8QwmtVtA6M7grmD9zflJ8VMqwve6BnzlYrMVR5X2Z2p0O8ATsdgAGnW5xAL-U86IuaBcsAIaGV4WK8DTJQUfb9vWK2A9J25kEVldTElQYqd8w6pqju1-P49Pc0cW93tuuwnEUVHlw7d1TkIrhizcxSoEjS2f58jjgviBNCB392G-qsoBXmeODKJ7V8P916PNj3kZPbxm',
  social:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAB3MCwZBtiGF5cggkrgGllgUvjNErZh7kOWGIZdrctw2vvB5_OOFRnzXXv8lZDOw2KtU40sBvdEpvSmLqXBPYw_H2eEya67zeClkQxS5ApYXH5d-tnRADURrl6jSeyQc6xsrytYlQZRiMeWRQEACRSSgQQH4Y3dyCYPMQIPC9kcjwYmLYLKK5XdBpGI6KsH2wOmap2oCPHPsx3vMt_pC5IvcCb38NCpCPK0GN9vXQpyRq_GrwrHULv',
};

/**
 * POST /api/ai/generate-image
 *
 * Generate an AI-enhanced product image from a source image and text prompt.
 *
 * Currently operates in **demo mode** — returns mock images after a simulated
 * processing delay. To connect a real AI provider (fal.ai, Replicate, Google
 * Gemini Image), update the `generateImage` function below with the provider SDK
 * call and add the corresponding API key to `.env`.
 *
 * @agent:forge Connect real AI image generation provider when API keys are available
 */
export const POST = withAuthRoute(async (req: NextRequest, actor) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError('Invalid JSON request body', null, 400);
  }

  const parseResult = GenerateImageSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError(
      'Validation failed',
      parseResult.error.flatten().fieldErrors,
      400,
    );
  }

  const { style, aspectRatio } = parseResult.data;
  const _tenantId = actor.tenantId;

  // --- Demo mode: simulate AI processing delay ---
  // TODO: Replace with actual AI provider call (fal.ai, Replicate, or Google Gemini Image)
  // Example integration point:
  //   const result = await falClient.run('fal-ai/flux/dev/image-to-image', {
  //     input: { image_url: sourceImage, prompt, image_size: aspectRatio }
  //   });
  const startTime = Date.now();
  await new Promise((resolve) => setTimeout(resolve, 1800 + Math.random() * 700));
  const generationTimeMs = Date.now() - startTime;

  const imageUrl = MOCK_GENERATED_IMAGES[style ?? 'product_photo'];

  return apiSuccess(
    {
      imageUrl,
      model: 'mock-v1',
      style,
      aspectRatio,
      generationTimeMs,
      cached: false,
    },
    undefined,
    201,
  );
});
