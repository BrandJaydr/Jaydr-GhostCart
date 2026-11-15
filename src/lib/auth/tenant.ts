import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Return a database-compatible tenant UUID only for an authenticated session. */
export async function getAuthenticatedTenantId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const user = session?.user as { tenantId?: unknown } | null | undefined;
  const tenantId = user?.tenantId;

  return typeof tenantId === 'string' && UUID_PATTERN.test(tenantId)
    ? tenantId
    : null;
}
