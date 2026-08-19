/**
 * Resolve Actor — Unified Auth Middleware
 *
 * Determines "who is making this request" from either:
 *   1. A NextAuth JWT session (web UI / browser)
 *   2. A GhostCart API key (CLI, agents, automation scripts)
 *
 * All API route handlers should call `resolveActor(request)` instead of
 * reading the session or headers directly. This is the single chokepoint
 * that replaces all scattered `DEV_TENANT_ID` fallbacks.
 *
 * Usage in a route handler:
 *
 *   export async function GET(request: NextRequest) {
 *     const actor = await resolveActor(request);
 *     if (!actor) return apiError('Unauthorized', undefined, 401);
 *     // actor.tenantId, actor.userId, actor.authMethod are all available
 *   }
 *
 * @agent:forge Replace every `DEV_TENANT_ID` fallback in route handlers with
 *              `resolveActor()`. See Stage 5 security gate in tasks/todo.md.
 */

import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import {
  extractBearerToken,
  verifyApiKey,
  type ApiKeyActor,
} from '@/lib/auth/api-key';

export interface Actor {
  userId: string;
  tenantId: string;
  role?: string;
  authMethod: 'session' | 'api_key';
  /** Present only when authMethod is 'api_key' */
  keyId?: string;
  scopes?: string[];
}

/**
 * Resolves the authenticated actor from the request.
 * Returns null if the request is unauthenticated.
 *
 * Auth priority:
 *   1. API key in `Authorization: Bearer gc_<token>` header
 *   2. NextAuth JWT in `next-auth.session-token` cookie
 */
export async function resolveActor(
  request: NextRequest,
): Promise<Actor | null> {
  // ── 1. API Key path ───────────────────────────────────────────────────────
  const authHeader = request.headers.get('authorization');
  const rawToken = extractBearerToken(authHeader);

  if (rawToken?.startsWith('gc_')) {
    const keyActor: ApiKeyActor | null = await verifyApiKey(rawToken);
    if (keyActor) {
      return {
        userId: keyActor.userId,
        tenantId: keyActor.tenantId,
        authMethod: 'api_key',
        keyId: keyActor.keyId,
        scopes: keyActor.scopes,
      };
    }
    // A gc_ token was provided but is invalid — fail closed, don't fall through
    return null;
  }

  // ── 2. NextAuth session path ──────────────────────────────────────────────
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) return null;

  const tenantId = (token as Record<string, unknown>).tenantId as string | undefined;
  const userId = token.sub ?? (token as Record<string, unknown>).id as string | undefined;
  const role = (token as Record<string, unknown>).role as string | undefined;

  if (!tenantId || !userId) return null;

  return {
    userId,
    tenantId,
    role,
    authMethod: 'session',
  };
}

/**
 * Convenience wrapper: resolves actor and throws a 401 Response if absent.
 * Use this in route handlers that always require auth.
 *
 *   const actor = await requireActor(request);  // throws if unauthenticated
 */
export async function requireActor(request: NextRequest): Promise<Actor> {
  const actor = await resolveActor(request);
  if (!actor) {
    throw new Response(
      JSON.stringify({ status: 'error', error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }
  return actor;
}
