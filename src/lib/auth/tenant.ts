import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolve the tenant from the authenticated NextAuth session.
 * Returns null when the request is anonymous or the session does not contain
 * a database-compatible tenant UUID. Never falls back to a shared dev tenant.
 */
export async function getAuthenticatedTenantId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const tenantId = (session?.user as (typeof session.user & { tenantId?: unknown }) | undefined)?.tenantId;

  if (!session?.user || typeof tenantId !== 'string' || !UUID_PATTERN.test(tenantId)) {
    return null;
  }

  return tenantId;
}
