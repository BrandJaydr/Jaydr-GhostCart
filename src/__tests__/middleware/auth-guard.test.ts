/**
 * Auth Guard RBAC Tests
 *
 * Unit tests for role-based access control middleware.
 * Tests cover authentication, authorization, permission checks, and error handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  requireAuth,
  requireRole,
  requireAnyRole,
  requirePermission,
  requireAnyPermission,
  requireTenant,
  hasPermission,
  hasAnyPermission,
  requireAuthWithRole,
  requireAuthWithPermissions,
  Permission,
  AuthErrorCode,
} from '@/lib/middleware/auth-guard';
import { type Actor } from '@/lib/middleware/resolve-actor';

// Mock resolveActor
vi.mock('@/lib/middleware/resolve-actor', () => ({
  resolveActor: vi.fn(),
}));

// Mock apiError
vi.mock('@/lib/api/response', () => ({
  apiError: vi.fn((message, details, status) => {
    const error = new Error(message) as Error & { status: number; details: Record<string, unknown> };
    error.status = status;
    error.details = details;
    throw error;
  }),
}));

import { resolveActor } from '@/lib/middleware/resolve-actor';
import { apiError } from '@/lib/api/response';

describe('Auth Guard - RBAC Middleware', () => {
  const mockActor: Actor = {
    userId: 'user-123',
    tenantId: 'tenant-456',
    role: 'owner',
    authMethod: 'session',
  };

  const mockRequest = new NextRequest('http://localhost:3000/api/test');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('requireAuth', () => {
    it('should return actor when authenticated', async () => {
      vi.mocked(resolveActor).mockResolvedValue(mockActor);

      const actor = await requireAuth(mockRequest);

      expect(actor).toEqual(mockActor);
      expect(resolveActor).toHaveBeenCalledWith(mockRequest);
    });

    it('should throw 401 when unauthenticated', async () => {
      vi.mocked(resolveActor).mockResolvedValue(null);

      await expect(requireAuth(mockRequest)).rejects.toThrow('Authentication required');
      await expect(requireAuth(mockRequest)).rejects.toHaveProperty('status', 401);
      expect(apiError).toHaveBeenCalledWith(
        'Authentication required',
        { code: AuthErrorCode.UNAUTHORIZED },
        401,
      );
    });
  });

  describe('requireRole', () => {
    it('should allow when role matches', async () => {
      const actor = { ...mockActor, role: 'owner' as const };

      await expect(requireRole(actor, 'owner')).resolves.not.toThrow();
    });

    it('should throw 403 when role does not match', async () => {
      const actor = { ...mockActor, role: 'va' as const };

      await expect(requireRole(actor, 'owner')).rejects.toThrow("Role 'owner' required");
      await expect(requireRole(actor, 'owner')).rejects.toHaveProperty('status', 403);
      expect(apiError).toHaveBeenCalledWith(
        "Role 'owner' required",
        {
          code: AuthErrorCode.FORBIDDEN,
          currentRole: 'va',
          requiredRole: 'owner',
        },
        403,
      );
    });

    it('should throw 403 when role is missing', async () => {
      const actor = { ...mockActor, role: undefined };

      await expect(requireRole(actor, 'owner')).rejects.toThrow("Role 'owner' required");
      expect(apiError).toHaveBeenCalledWith(
        "Role 'owner' required",
        {
          code: AuthErrorCode.FORBIDDEN,
          currentRole: 'none',
          requiredRole: 'owner',
        },
        403,
      );
    });
  });

  describe('requireAnyRole', () => {
    it('should allow when actor has one of the allowed roles', async () => {
      const actor = { ...mockActor, role: 'va' as const };

      await expect(requireAnyRole(actor, ['owner', 'va', 'accountant'])).resolves.not.toThrow();
    });

    it('should throw 403 when actor has none of the allowed roles', async () => {
      const actor = { ...mockActor, role: 'accountant' as const };

      await expect(requireAnyRole(actor, ['owner', 'va'])).rejects.toThrow(
        "One of roles 'owner, va' required",
      );
      expect(apiError).toHaveBeenCalledWith(
        "One of roles 'owner, va' required",
        {
          code: AuthErrorCode.FORBIDDEN,
          currentRole: 'accountant',
          allowedRoles: ['owner', 'va'],
        },
        403,
      );
    });
  });

  describe('requirePermission', () => {
    it('should allow when role has the required permission', async () => {
      const actor = { ...mockActor, role: 'owner' as const };

      await expect(requirePermission(actor, Permission.PRODUCTS_WRITE)).resolves.not.toThrow();
    });

    it('should throw 403 when role lacks the required permission', async () => {
      const actor = { ...mockActor, role: 'accountant' as const };

      await expect(requirePermission(actor, Permission.PRODUCTS_WRITE)).rejects.toThrow(
        "Permission 'products:write' not granted",
      );
      expect(apiError).toHaveBeenCalledWith(
        "Permission 'products:write' not granted",
        {
          code: AuthErrorCode.MISSING_PERMISSION,
          role: 'accountant',
          permission: Permission.PRODUCTS_WRITE,
        },
        403,
      );
    });

    it('should throw 403 when role is missing', async () => {
      const actor = { ...mockActor, role: undefined };

      await expect(requirePermission(actor, Permission.PRODUCTS_READ)).rejects.toThrow(
        'Role required for permission check',
      );
      expect(apiError).toHaveBeenCalledWith(
        'Role required for permission check',
        { code: AuthErrorCode.INVALID_ROLE },
        403,
      );
    });
  });

  describe('requireAnyPermission', () => {
    it('should allow when role has at least one of the required permissions', async () => {
      const actor = { ...mockActor, role: 'va' as const };

      await expect(
        requireAnyPermission(actor, [Permission.PRODUCTS_WRITE, Permission.USERS_WRITE]),
      ).resolves.not.toThrow();
    });

    it('should throw 403 when role has none of the required permissions', async () => {
      const actor = { ...mockActor, role: 'accountant' as const };

      await expect(
        requireAnyPermission(actor, [Permission.PRODUCTS_WRITE, Permission.USERS_WRITE]),
      ).rejects.toThrow("None of permissions 'products:write, users:write' granted");
      expect(apiError).toHaveBeenCalledWith(
        "None of permissions 'products:write, users:write' granted",
        {
          code: AuthErrorCode.MISSING_PERMISSION,
          role: 'accountant',
          requiredPermissions: [Permission.PRODUCTS_WRITE, Permission.USERS_WRITE],
        },
        403,
      );
    });
  });

  describe('requireTenant', () => {
    it('should allow when tenant IDs match', async () => {
      await expect(requireTenant(mockActor, 'tenant-456')).resolves.not.toThrow();
    });

    it('should throw 403 when tenant IDs do not match', async () => {
      await expect(requireTenant(mockActor, 'tenant-789')).rejects.toThrow('Tenant access denied');
      expect(apiError).toHaveBeenCalledWith(
        'Tenant access denied',
        {
          code: AuthErrorCode.TENANT_MISMATCH,
          actorTenantId: 'tenant-456',
          expectedTenantId: 'tenant-789',
        },
        403,
      );
    });
  });

  describe('hasPermission', () => {
    it('should return true when role has the permission', () => {
      const actor = { ...mockActor, role: 'owner' as const };

      expect(hasPermission(actor, Permission.PRODUCTS_WRITE)).toBe(true);
    });

    it('should return false when role lacks the permission', () => {
      const actor = { ...mockActor, role: 'accountant' as const };

      expect(hasPermission(actor, Permission.PRODUCTS_WRITE)).toBe(false);
    });

    it('should return false when role is missing', () => {
      const actor = { ...mockActor, role: undefined };

      expect(hasPermission(actor, Permission.PRODUCTS_READ)).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true when role has at least one of the permissions', () => {
      const actor = { ...mockActor, role: 'va' as const };

      expect(
        hasAnyPermission(actor, [Permission.PRODUCTS_WRITE, Permission.USERS_WRITE]),
      ).toBe(true);
    });

    it('should return false when role has none of the permissions', () => {
      const actor = { ...mockActor, role: 'accountant' as const };

      expect(
        hasAnyPermission(actor, [Permission.PRODUCTS_WRITE, Permission.USERS_WRITE]),
      ).toBe(false);
    });
  });

  describe('requireAuthWithRole', () => {
    it('should authenticate and verify role in one call', async () => {
      vi.mocked(resolveActor).mockResolvedValue(mockActor);

      const actor = await requireAuthWithRole(mockRequest, 'owner');

      expect(actor).toEqual(mockActor);
      expect(resolveActor).toHaveBeenCalledWith(mockRequest);
    });

    it('should throw 401 when unauthenticated', async () => {
      vi.mocked(resolveActor).mockResolvedValue(null);

      await expect(requireAuthWithRole(mockRequest, 'owner')).rejects.toThrow(
        'Authentication required',
      );
    });

    it('should throw 403 when role does not match', async () => {
      const actor = { ...mockActor, role: 'va' as const };
      vi.mocked(resolveActor).mockResolvedValue(actor);

      await expect(requireAuthWithRole(mockRequest, 'owner')).rejects.toThrow(
        "Role 'owner' required",
      );
    });
  });

  describe('requireAuthWithPermissions', () => {
    it('should authenticate and verify permissions in one call', async () => {
      vi.mocked(resolveActor).mockResolvedValue(mockActor);

      const actor = await requireAuthWithPermissions(mockRequest, [Permission.PRODUCTS_WRITE]);

      expect(actor).toEqual(mockActor);
      expect(resolveActor).toHaveBeenCalledWith(mockRequest);
    });

    it('should throw 401 when unauthenticated', async () => {
      vi.mocked(resolveActor).mockResolvedValue(null);

      await expect(
        requireAuthWithPermissions(mockRequest, [Permission.PRODUCTS_WRITE]),
      ).rejects.toThrow('Authentication required');
    });

    it('should throw 403 when permissions not granted', async () => {
      const actor = { ...mockActor, role: 'accountant' as const };
      vi.mocked(resolveActor).mockResolvedValue(actor);

      await expect(
        requireAuthWithPermissions(mockRequest, [Permission.PRODUCTS_WRITE]),
      ).rejects.toThrow("None of permissions 'products:write' granted");
    });
  });

  describe('Role Permission Matrix', () => {
    it('owner should have all permissions', () => {
      const ownerActor = { ...mockActor, role: 'owner' as const };

      Object.values(Permission).forEach((permission) => {
        expect(hasPermission(ownerActor, permission)).toBe(true);
      });
    });

    it('va should have product and listing permissions but not user management', () => {
      const vaActor = { ...mockActor, role: 'va' as const };

      expect(hasPermission(vaActor, Permission.PRODUCTS_WRITE)).toBe(true);
      expect(hasPermission(vaActor, Permission.LISTINGS_WRITE)).toBe(true);
      expect(hasPermission(vaActor, Permission.USERS_WRITE)).toBe(false);
      expect(hasPermission(vaActor, Permission.SETTINGS_WRITE)).toBe(false);
    });

    it('accountant should have read-only financial access', () => {
      const accountantActor = { ...mockActor, role: 'accountant' as const };

      expect(hasPermission(accountantActor, Permission.PRODUCTS_READ)).toBe(true);
      expect(hasPermission(accountantActor, Permission.FINANCIAL_READ)).toBe(true);
      expect(hasPermission(accountantActor, Permission.PRODUCTS_WRITE)).toBe(false);
      expect(hasPermission(accountantActor, Permission.FINANCIAL_WRITE)).toBe(false);
    });
  });
});
