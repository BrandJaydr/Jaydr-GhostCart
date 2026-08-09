import type { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { z } from 'zod';
import { applySuggestion, approveSuggestion, rejectSuggestion } from '@/lib/repricing/engine';

/**
 * Schema for applying repricing suggestion
 */
const ApplySuggestionSchema = z.object({
  suggestionId: z.string().uuid(),
  dryRun: z.boolean().default(false),
});

/**
 * POST /api/repricing/apply
 * Apply an approved repricing suggestion
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError('Invalid JSON request body', null, 400);
  }

  const parseResult = ApplySuggestionSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError('Validation failed', parseResult.error.flatten().fieldErrors, 400);
  }

  const { suggestionId, dryRun } = parseResult.data;

  // @agent:forge Replace with session userId
  const userId = '00000000-0000-0000-0000-000000000001';

  try {
    if (dryRun) {
      // Dry run - just approve without applying
      const approved = await approveSuggestion(suggestionId);
      if (!approved) {
        return apiError('Failed to approve suggestion', null, 400);
      }
      return apiSuccess({ suggestionId, dryRun: true, applied: false });
    }

    // Apply the suggestion
    const applied = await applySuggestion(suggestionId, userId);
    if (!applied) {
      return apiError('Failed to apply suggestion', null, 400);
    }

    return apiSuccess({ suggestionId, dryRun: false, applied: true });
  } catch (err) {
    console.error('[api/repricing/apply] error:', err);
    return apiError('Failed to apply suggestion', null, 500);
  }
}

/**
 * PATCH /api/repricing/apply
 * Approve or reject a suggestion
 */
export async function PATCH(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError('Invalid JSON request body', null, 400);
  }

  const { suggestionId, action } = body as { suggestionId?: string; action?: string };

  if (!suggestionId || !action) {
    return apiError('Missing suggestionId or action', null, 400);
  }

  try {
    if (action === 'approve') {
      const approved = await approveSuggestion(suggestionId);
      if (!approved) {
        return apiError('Failed to approve suggestion', null, 400);
      }
      return apiSuccess({ suggestionId, status: 'approved' });
    } else if (action === 'reject') {
      const rejected = await rejectSuggestion(suggestionId);
      if (!rejected) {
        return apiError('Failed to reject suggestion', null, 400);
      }
      return apiSuccess({ suggestionId, status: 'rejected' });
    } else {
      return apiError('Invalid action. Use "approve" or "reject"', null, 400);
    }
  } catch (err) {
    console.error('[api/repricing/apply] PATCH error:', err);
    return apiError('Failed to update suggestion', null, 500);
  }
}
