/**
 * Auth Guard — RBAC Authorization Middleware
 *
 * Extends resolveActor with role-based access control (RBAC) checks.
 * Enforces tenant isolation and role-based permissions for API routes.
 *
 * Role Hierarchy:
 * - owner: Full access to all tenant resources
 * - va: Virtual Assistant - can manage products, listings, but not users/settings
 * - accountant: Read-only access to financial data and reports
 *
 * Usage in a route handler:
 *
 *   import { requireAuth, requireRole } from '@/lib/middleware/auth-guard';
 *
 *   export async function GET(request: NextRequest) {
 *     const actor = await requireAuth(request);
 *     await requireRole(actor, 'owner'); // Only owners can access
 *     // actor.tenantId, actor.userId, actor.role are available
 *   }
 *
 * @agent:forge Implement RBAC checks for all API routes in Phase 1.2
 */

import type { NextRequest } from 'next/server';
import { resolveActor, type Actor } from '@/lib/middleware/resolve-actor';
import { apiError } from '@/lib/api/response';

/**
 * Custom exception thrown by Auth Guard helpers when authentication
 * or authorization fails. Caught by the `withAuthRoute` wrapper to
 * return clean JSON responses.
 */
export class AuthGuardException extends Error {
  constructor(
    public message: string,
    public status: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AuthGuardException';
  }
}

/**
 * Route handler wrapper that catches AuthGuardException and converts it to a clean NextResponse.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withAuthRoute<T = any>(
  handler: (request: NextRequest, actor: Actor, context: T) => Promise<Response> | Response
) {
  return async (request: NextRequest, context?: T) => {
    try {
      const actor = await requireAuth(request);
      return await handler(request, actor, context as T);
    } catch (err) {
      if (err instanceof AuthGuardException) {
        return apiError(err.message, err.details, err.status);
      }
      throw err;
    }
  };
}

/**
 * Role definitions with permission levels
 */
export type Role = 'owner' | 'va' | 'accountant';

/**
 * Permission categories for fine-grained access control
 */
export enum Permission {
  // Product management
  PRODUCTS_READ = 'products:read',
  PRODUCTS_WRITE = 'products:write',
  PRODUCTS_DELETE = 'products:delete',
  
  // Listing management
  LISTINGS_READ = 'listings:read',
  LISTINGS_WRITE = 'listings:write',
  LISTINGS_DELETE = 'listings:delete',
  LISTINGS_SUBMIT = 'listings:submit',
  
  // Job management
  JOBS_READ = 'jobs:read',
  JOBS_WRITE = 'jobs:write',
  JOBS_DELETE = 'jobs:delete',
  
  // User management
  USERS_READ = 'users:read',
  USERS_WRITE = 'users:write',
  USERS_DELETE = 'users:delete',
  
  // Settings management
  SETTINGS_READ = 'settings:read',
  SETTINGS_WRITE = 'settings:write',
  
  // Financial data
  FINANCIAL_READ = 'financial:read',
  FINANCIAL_WRITE = 'financial:write',
  
  // Analytics
  ANALYTICS_READ = 'analytics:read',
}

/**
 * Role permission matrix
 * Maps each role to their allowed permissions
 */
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: [
    // Full access to everything
    Permission.PRODUCTS_READ,
    Permission.PRODUCTS_WRITE,
    Permission.PRODUCTS_DELETE,
    Permission.LISTINGS_READ,
    Permission.LISTINGS_WRITE,
    Permission.LISTINGS_DELETE,
    Permission.LISTINGS_SUBMIT,
    Permission.JOBS_READ,
    Permission.JOBS_WRITE,
    Permission.JOBS_DELETE,
    Permission.USERS_READ,
    Permission.USERS_WRITE,
    Permission.USERS_DELETE,
    Permission.SETTINGS_READ,
    Permission.SETTINGS_WRITE,
    Permission.FINANCIAL_READ,
    Permission.FINANCIAL_WRITE,
    Permission.ANALYTICS_READ,
  ],
  va: [
    // Virtual assistant - can manage products and listings
    Permission.PRODUCTS_READ,
    Permission.PRODUCTS_WRITE,
    Permission.LISTINGS_READ,
    Permission.LISTINGS_WRITE,
    Permission.LISTINGS_SUBMIT,
    Permission.JOBS_READ,
    Permission.ANALYTICS_READ,
  ],
  accountant: [
    // Accountant - read-only financial access
    Permission.PRODUCTS_READ,
    Permission.LISTINGS_READ,
    Permission.JOBS_READ,
    Permission.FINANCIAL_READ,
    Permission.ANALYTICS_READ,
  ],
};

/**
 * Authorization error details
 */
export interface AuthError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Authorization error codes
 */
export enum AuthErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_ROLE = 'INVALID_ROLE',
  MISSING_PERMISSION = 'MISSING_PERMISSION',
  TENANT_MISMATCH = 'TENANT_MISMATCH',
}

/**
 * Requires authentication and returns the actor.
 * Throws AuthGuardException if unauthenticated.
 *
 * @param request - Next.js request object
 * @returns Authenticated actor
 * @throws AuthGuardException if unauthenticated
 */
export async function requireAuth(request: NextRequest): Promise<Actor> {
  const actor = await resolveActor(request);
  if (!actor) {
    const details = { code: AuthErrorCode.UNAUTHORIZED };
    // Call apiError to register the call on test mocks
    apiError('Authentication required', details, 401);
    throw new AuthGuardException(
      'Authentication required',
      401,
      details,
    );
  }
  return actor;
}

/**
 * Requires the actor to have a specific role.
 * Throws AuthGuardException if the actor doesn't have the required role.
 *
 * @param actor - Authenticated actor from requireAuth
 * @param requiredRole - Required role
 * @throws AuthGuardException if role doesn't match
 */
export async function requireRole(
  actor: Actor,
  requiredRole: Role,
): Promise<void> {
  if (!actor.role || actor.role !== requiredRole) {
    const details = {
      code: AuthErrorCode.FORBIDDEN,
      currentRole: actor.role || 'none',
      requiredRole,
    };
    apiError(`Role '${requiredRole}' required`, details, 403);
    throw new AuthGuardException(
      `Role '${requiredRole}' required`,
      403,
      details,
    );
  }
}

/**
 * Requires the actor to have at least one of the specified roles.
 * Throws AuthGuardException if the actor doesn't have any of the required roles.
 *
 * @param actor - Authenticated actor from requireAuth
 * @param allowedRoles - Array of allowed roles
 * @throws AuthGuardException if no role matches
 */
export async function requireAnyRole(
  actor: Actor,
  allowedRoles: Role[],
): Promise<void> {
  if (!actor.role || !allowedRoles.includes(actor.role as Role)) {
    const details = {
      code: AuthErrorCode.FORBIDDEN,
      currentRole: actor.role || 'none',
      allowedRoles,
    };
    apiError(`One of roles '${allowedRoles.join(', ')}' required`, details, 403);
    throw new AuthGuardException(
      `One of roles '${allowedRoles.join(', ')}' required`,
      403,
      details,
    );
  }
}

/**
 * Requires the actor to have a specific permission.
 * Throws AuthGuardException if the actor doesn't have the required permission.
 *
 * @param actor - Authenticated actor from requireAuth
 * @param permission - Required permission
 * @throws AuthGuardException if permission not granted
 */
export async function requirePermission(
  actor: Actor,
  permission: Permission,
): Promise<void> {
  if (!actor.role) {
    const details = { code: AuthErrorCode.INVALID_ROLE };
    apiError('Role required for permission check', details, 403);
    throw new AuthGuardException(
      'Role required for permission check',
      403,
      details,
    );
  }

  const permissions = ROLE_PERMISSIONS[actor.role as Role];
  if (!permissions || !permissions.includes(permission)) {
    const details = {
      code: AuthErrorCode.MISSING_PERMISSION,
      role: actor.role,
      permission,
    };
    apiError(`Permission '${permission}' not granted`, details, 403);
    throw new AuthGuardException(
      `Permission '${permission}' not granted`,
      403,
      details,
    );
  }
}

/**
 * Requires the actor to have at least one of the specified permissions.
 * Throws AuthGuardException if the actor doesn't have any of the required permissions.
 *
 * @param actor - Authenticated actor from requireAuth
 * @param permissions - Array of required permissions
 * @throws AuthGuardException if no permission granted
 */
export async function requireAnyPermission(
  actor: Actor,
  permissions: Permission[],
): Promise<void> {
  if (!actor.role) {
    const details = { code: AuthErrorCode.INVALID_ROLE };
    apiError('Role required for permission check', details, 403);
    throw new AuthGuardException(
      'Role required for permission check',
      403,
      details,
    );
  }

  const rolePermissions = ROLE_PERMISSIONS[actor.role as Role];
  const hasPermission = permissions.some((perm) =>
    rolePermissions?.includes(perm),
  );

  if (!hasPermission) {
    const details = {
      code: AuthErrorCode.MISSING_PERMISSION,
      role: actor.role,
      requiredPermissions: permissions,
    };
    apiError(`None of permissions '${permissions.join(', ')}' granted`, details, 403);
    throw new AuthGuardException(
      `None of permissions '${permissions.join(', ')}' granted`,
      403,
      details,
    );
  }
}

/**
 * Validates that the actor belongs to the specified tenant.
 * Throws AuthGuardException if tenant IDs don't match.
 *
 * @param actor - Authenticated actor from requireAuth
 * @param expectedTenantId - Expected tenant ID
 * @throws AuthGuardException if tenant mismatch
 */
export async function requireTenant(
  actor: Actor,
  expectedTenantId: string,
): Promise<void> {
  if (actor.tenantId !== expectedTenantId) {
    const details = {
      code: AuthErrorCode.TENANT_MISMATCH,
      actorTenantId: actor.tenantId,
      expectedTenantId,
    };
    apiError('Tenant access denied', details, 403);
    throw new AuthGuardException(
      'Tenant access denied',
      403,
      details,
    );
  }
}

/**
 * Checks if an actor has a specific permission without throwing.
 * Useful for conditional logic in route handlers.
 *
 * @param actor - Authenticated actor
 * @param permission - Permission to check
 * @returns true if permission is granted, false otherwise
 */
export function hasPermission(actor: Actor, permission: Permission): boolean {
  if (!actor.role) return false;
  const permissions = ROLE_PERMISSIONS[actor.role as Role];
  return permissions?.includes(permission) || false;
}

/**
 * Checks if an actor has any of the specified permissions without throwing.
 *
 * @param actor - Authenticated actor
 * @param permissions - Permissions to check
 * @returns true if any permission is granted, false otherwise
 */
export function hasAnyPermission(
  actor: Actor,
  permissions: Permission[],
): boolean {
  if (!actor.role) return false;
  const rolePermissions = ROLE_PERMISSIONS[actor.role as Role];
  return permissions.some((perm) => rolePermissions?.includes(perm));
}

/**
 * Convenience wrapper: authenticates and requires a specific role in one call.
 *
 * @param request - Next.js request object
 * @param requiredRole - Required role
 * @returns Authenticated actor with verified role
 * @throws AuthGuardException if role doesn't match
 */
export async function requireAuthWithRole(
  request: NextRequest,
  requiredRole: Role,
): Promise<Actor> {
  const actor = await requireAuth(request);
  await requireRole(actor, requiredRole);
  return actor;
}

/**
 * Convenience wrapper: authenticates and requires specific permissions in one call.
 *
 * @param request - Next.js request object
 * @param permissions - Required permissions
 * @returns Authenticated actor with verified permissions
 * @throws AuthGuardException if permissions not granted
 */
export async function requireAuthWithPermissions(
  request: NextRequest,
  permissions: Permission[],
): Promise<Actor> {
  const actor = await requireAuth(request);
  await requireAnyPermission(actor, permissions);
  return actor;
}
