# Phase 0.2: Current Authentication Flow & Dependencies

**Date:** 2026-08-16  
**Purpose:** Document current authentication flow and dependencies for migration planning

---

## Current Authentication Architecture

### Primary Authentication Middleware
**File:** `src/lib/middleware/resolve-actor.ts`  
**Status:** ✅ Fully Implemented  
**Capability:** Unified authentication for both web sessions and API keys

### Authentication Methods Supported

#### 1. NextAuth Session (Web UI)
- **Method:** JWT token in `next-auth.session-token` cookie
- **Flow:** Browser → NextAuth session → resolveActor → tenantId/userId
- **Usage:** Web dashboard and UI interactions
- **Token Source:** NextAuth JWT with tenantId, userId, role claims

#### 2. API Key Authentication (CLI/Agents)
- **Method:** Bearer token in `Authorization: gc_<token>` header
- **Flow:** CLI/Agent → API key → resolveActor → tenantId/userId
- **Usage:** CLI tool, automation scripts, AI agents
- **Token Source:** Database-stored SHA-256 hash (migration 0016)

---

## resolveActor Middleware Details

### Function Signature
```typescript
export async function resolveActor(request: NextRequest): Promise<Actor | null>
```

### Actor Interface
```typescript
interface Actor {
  userId: string;
  tenantId: string;
  role?: string;
  authMethod: 'session' | 'api_key';
  keyId?: string;        // Present only for api_key auth
  scopes?: string[];     // Present only for api_key auth
}
```

### Authentication Priority
1. **API Key First:** Checks `Authorization: Bearer gc_<token>` header
2. **Session Fallback:** Checks NextAuth JWT in cookie
3. **Fail Closed:** Returns null if neither authentication method succeeds

### Convenience Wrapper
```typescript
export async function requireActor(request: NextRequest): Promise<Actor>
```
- Throws 401 Response if unauthenticated
- Use in routes that always require authentication

---

## Current Usage Patterns

### Pattern 1: resolveActor (Recommended)
```typescript
import { resolveActor } from '@/lib/middleware/resolve-actor';

export async function GET(request: NextRequest) {
  const actor = await resolveActor(request);
  if (!actor) return apiError('Unauthorized', undefined, 401);
  // Use actor.tenantId, actor.userId, actor.role
}
```

### Pattern 2: requireActor (Convenience)
```typescript
import { requireActor } from '@/lib/middleware/resolve-actor';

export async function POST(request: NextRequest) {
  const actor = await requireActor(request); // Throws 401 if unauthenticated
  // Use actor.tenantId, actor.userId, actor.role
}
```

### Pattern 3: DEV_TENANT_ID Fallback (Current - To Be Removed)
```typescript
import { DEV_TENANT_ID } from '@/lib/db/index';

const tenantId = DEV_TENANT_ID; // ❌ Security risk - must be replaced
```

---

## Database Dependencies

### Migration 0016: API Keys Schema
**File:** `src/db/migrations/0016_api_keys.sql`  
**Status:** ✅ Implemented  
**Purpose:** API key storage and verification

#### Key Tables
- `api_keys` - Stores API key hashes and metadata
- `users` - Global email unique index for CLI login

#### Security Features
- SHA-256 hashing of raw keys (never stored plaintext)
- Key prefix storage (first 8 chars) for user identification
- RLS policies for tenant isolation
- Revocation support (soft delete via `revoked_at`)

---

## API Key Authentication Flow

### Key Generation
1. User requests API key via `/api/auth/keys` (POST)
2. System generates random token
3. System stores SHA-256 hash + prefix
4. System returns full token to user (one-time display)

### Key Verification
1. Client sends `Authorization: Bearer gc_<token>` header
2. `extractBearerToken()` extracts token from header
3. `verifyApiKey()` computes SHA-256 and queries database
4. Returns `ApiKeyActor` with userId, tenantId, scopes if valid
5. Returns null if invalid/expired/revoked

### Key Management
- **List Keys:** GET `/api/auth/keys`
- **Create Key:** POST `/api/auth/keys`
- **Revoke Key:** DELETE `/api/auth/keys/[id]`

---

## NextAuth Session Flow

### Session Configuration
**File:** `src/lib/auth/config.ts`  
**Provider:** CredentialsProvider  
**Database:** PostgreSQL (users table)

### Session Claims
```typescript
{
  tenantId: string;  // From users.tenant_id
  userId: string;    // From users.id (token.sub)
  role: string;      // From users.role
  email: string;     // From users.email
}
```

### Session Resolution
1. `getToken()` extracts JWT from cookie
2. Validates against NEXTAUTH_SECRET
3. Extracts tenantId, userId, role from token claims
4. Returns Actor object if all required fields present

---

## Current Route Authentication Status

### Routes Using resolveActor (✅ Properly Authenticated)
- `/api/auth/login` - Programmatic auth for CLI
- `/api/auth/keys` - API key management

### Routes Using DEV_TENANT_ID (❌ Security Risk - ERR-016)
- All other API routes (21 files identified in Phase 0.1)

### Dashboard Layout (✅ Session Protected)
- `src/app/(dashboard)/layout.tsx` - Uses `getServerSession()` for redirect

---

## Dependencies Analysis

### Direct Dependencies
- `next-auth/jwt` - JWT token extraction/validation
- `@/lib/auth/api-key` - API key extraction/verification
- `next-auth` - Session management

### Database Dependencies
- `users` table - User authentication data
- `api_keys` table - API key storage
- `tenants` table - Tenant isolation

### Configuration Dependencies
- `NEXTAUTH_SECRET` - JWT signing secret
- `DATABASE_URL` - Database connection
- Redis (optional) - Session caching (not currently used)

---

## Integration Points

### CLI Tool Integration
**Location:** `/cli/src/api-client.ts`  
**Method:** Bearer token injection  
**Flow:** CLI → API client → Authorization header → resolveActor

### Web UI Integration  
**Location:** `src/app/(dashboard)/layout.tsx`  
**Method:** Session redirect  
**Flow:** Browser → Session cookie → getServerSession → redirect

### API Route Integration
**Target:** All API routes  
**Method:** resolveActor/requireActor  
**Flow:** Request → resolveActor → Actor object → tenantId/userId

---

## Security Considerations

### Current Strengths
- ✅ Unified authentication middleware
- ✅ Support for both sessions and API keys
- ✅ Timing-safe API key verification
- ✅ SHA-256 hashing for keys (never stored plaintext)
- ✅ RLS policies for tenant isolation
- ✅ Fail-closed authentication (null if unauthenticated)

### Current Weaknesses
- ❌ 21 API routes still use DEV_TENANT_ID fallback
- ❌ No route-level RBAC enforcement
- ❌ Direct db.query calls bypass withTenant() context
- ❌ No feature flags for gradual auth rollout
- ❌ Limited monitoring of auth failures

---

## Migration Strategy

### Phase 1.1: Auth Guard Enhancement
- Create RBAC checks (owner, va, accountant roles)
- Add route-level authorization decorators
- Implement feature flag system
- Add auth failure monitoring

### Phase 1.2: DEV_TENANT_ID Migration
- Replace DEV_TENANT_ID with resolveActor() calls
- Split into low-risk (1.2a) and high-risk (1.2b) routes
- Use requireActor() for routes that always need auth
- Add comprehensive error handling

### Phase 1.3: Database Context Enforcement
- Audit all direct db.query calls
- Convert to withTenant() pattern
- Ensure RLS policies are active
- Add tenant isolation verification tests

---

## Testing Requirements

### Unit Tests
- Test resolveActor with valid API key
- Test resolveActor with valid session
- Test resolveActor with invalid credentials
- Test requireActor throws 401 on unauthenticated
- Test API key verification timing safety

### Integration Tests
- Test cross-tenant data isolation
- Test role-based access control
- Test session expiration handling
- Test API key revocation
- Test concurrent authentication requests

### Performance Tests
- Benchmark resolveActor latency
- Test concurrent session validation
- Measure database query overhead with RLS
- Validate memory usage with auth middleware

---

## Monitoring & Observability

### Metrics to Track
- Authentication success/failure rates
- API key usage patterns
- Session validation latency
- Tenant isolation violations
- Auth method distribution (session vs API key)

### Alerting Thresholds
- High authentication failure rate (>5%)
- API key verification failures
- Tenant isolation bypass attempts
- Unusual authentication patterns

---

## Next Steps

1. **Immediate:** Begin Phase 1.1 - Enhance auth guard with RBAC
2. **Week 1:** Implement feature flag system for gradual rollout
3. **Week 1-2:** Migrate low-risk routes (Phase 1.2a)
4. **Week 2:** Migrate high-risk routes (Phase 1.2b)
5. **Week 2:** Add comprehensive monitoring and alerting
6. **Week 2:** Complete database context enforcement (Phase 1.3)
