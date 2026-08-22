/**
 * POST /api/auth/signup
 *
 * Public self-service registration (dev/pilot scope).
 * Creates an account with a hashed password in the seeded dev tenant.
 * The client then completes login with the NextAuth Credentials provider.
 *
 * NOTE (multi-tenant): signups currently join the shared DEV_TENANT_ID.
 * When tenants are created per-signup (Stage 5), add an INSERT policy for
 * tenants and wrap the tenant + user insert in a single withTenant context.
 */

import type { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { db, DEV_TENANT_ID, withTenant } from '@/lib/db';
import { SignupSchema } from '@/lib/validation/schemas';
import { hashPassword } from '@/lib/auth/password';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid JSON body', undefined, 400);
  }

  const parsed = SignupSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('Validation failed', parsed.error.flatten().fieldErrors, 400);
  }

  const { email, password, name } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const existing = await db.query('SELECT 1 FROM users WHERE email = $1 LIMIT 1', [
      normalizedEmail,
    ]);
    if (existing.rowCount && existing.rowCount > 0) {
      return apiError('An account with this email already exists', undefined, 409);
    }

    const hashed = hashPassword(password);
    const user = await withTenant(DEV_TENANT_ID, async (client) => {
      const result = await client.query<{
        id: string;
        tenant_id: string;
        email: string;
        role: string;
      }>(
        `INSERT INTO users (tenant_id, email, role, hashed_password, name)
         VALUES ($1, $2, 'owner', $3, $4)
         RETURNING id, tenant_id, email, role`,
        [DEV_TENANT_ID, normalizedEmail, hashed, name ?? null],
      );
      return result.rows[0];
    });

    logger.info('auth', 'Account created', {
      email: user.email,
      tenantId: user.tenant_id,
      role: user.role,
    });

    return apiSuccess(
      { id: user.id, email: user.email, role: user.role, tenantId: user.tenant_id },
      undefined,
      201,
    );
  } catch (err) {
    logger.error('auth', 'Signup failed', err);
    if ((err as { code?: string }).code === '23505') {
      return apiError('An account with this email already exists', undefined, 409);
    }
    return apiError('Could not create account', undefined, 500);
  }
}