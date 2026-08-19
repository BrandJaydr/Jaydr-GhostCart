# Phase 0.1: DEV_TENANT_ID Usage Inventory

**Date:** 2026-08-16  
**Purpose:** Complete inventory of all DEV_TENANT_ID usage locations for migration planning

---

## Summary Statistics

- **Total Files with DEV_TENANT_ID:** 25 files
- **Test Files:** 4 files (mock usage - acceptable)
- **Production API Routes:** 21 files (require migration)
- **Critical Business Logic:** 8 files (high priority)
- **Non-Critical Routes:** 13 files (lower priority)

---

## Critical Business Logic Routes (High Priority - Phase 1.2b)

These routes handle core business operations and require careful migration with feature flags:

### 1. Product Management
- `src/app/api/products/route.ts` - Product import/listing
- `src/app/api/products/[id]/route.ts` - Individual product operations
- `src/app/api/products/[id]/corrections/route.ts` - Product corrections
- `src/app/api/products/[id]/review-status/route.ts` - Review workflow

### 2. Listing Management  
- `src/app/api/listings/route.ts` - Listing draft operations
- `src/app/api/listings/[id]/route.ts` - Individual listing operations

### 3. Job Management
- `src/app/api/jobs/activity/route.ts` - Job activity history
- `src/app/api/jobs/[id]/route.ts` - Individual job operations
- `src/app/api/jobs/[id]/retry/route.ts` - Job retry functionality

**Migration Strategy:** Implement feature flags, gradual rollout, comprehensive error handling

---

## Non-Critical Routes (Lower Priority - Phase 1.2a)

These routes can be migrated first to validate the approach:

### 1. AI Services
- `src/app/api/ai/analyze/route.ts` - AI analysis
- `src/app/api/ai/rewrite/route.ts` - AI content rewriting

### 2. Alerts & Dashboard
- `src/app/api/alerts/route.ts` - System alerts
- `src/app/api/dashboard/metrics/route.ts` - Dashboard metrics

### 3. eBay Integration
- `src/app/api/ebay/authorize/route.ts` - eBay authorization
- `src/app/api/ebay/export/csv/route.ts` - CSV export
- `src/app/api/ebay/submit/route.ts` - eBay submission
- `src/app/api/ebay/webhook/route.ts` - Webhook handling

### 4. Feedback System
- `src/app/api/feedback/route.ts` - User feedback

### 5. Repricing System
- `src/app/api/repricing/suggest/route.ts` - Repricing suggestions
- `src/app/api/repricing/apply/route.ts` - Apply repricing
- `src/app/api/repricing/pause/route.ts` - Pause repricing

**Migration Strategy:** Direct migration with monitoring, feature flags optional

---

## Test Files (Mock Usage - No Migration Required)

These files use DEV_TENANT_ID as mock data for testing:

- `src/__tests__/api/jobs.test.ts`
- `src/__tests__/api/listings.test.ts`
- `src/__tests__/api/products-stage2.test.ts`
- `src/__tests__/api/products.test.ts`

**Action:** Update test mocks to use session-derived IDs pattern, but not blocking

---

## Current Usage Patterns

### Pattern 1: Direct Assignment (Most Common)
```typescript
import { DEV_TENANT_ID } from '@/lib/db/index';
const tenantId = DEV_TENANT_ID;
```

### Pattern 2: withTenant Usage
```typescript
import { withTenant, DEV_TENANT_ID } from '@/lib/db';
await withTenant(DEV_TENANT_ID, async (client) => { ... });
```

### Pattern 3: Direct DB Query
```typescript
import { db, DEV_TENANT_ID } from '@/lib/db';
const result = await db.query('SELECT * FROM products WHERE tenant_id = $1', [DEV_TENANT_ID]);
```

---

## Migration Priority Matrix

| Route | Criticality | Dependencies | Migration Complexity | Phase |
|---|---|---|---|---|
| `/api/products/*` | Critical | High | Medium | 1.2b |
| `/api/listings/*` | Critical | High | Medium | 1.2b |
| `/api/jobs/*` | Critical | Medium | Low | 1.2b |
| `/api/ai/*` | Low | Low | Low | 1.2a |
| `/api/alerts` | Low | Low | Low | 1.2a |
| `/api/dashboard/metrics` | Low | Low | Low | 1.2a |
| `/api/ebay/*` | Medium | Medium | Medium | 1.2a |
| `/api/feedback` | Low | Low | Low | 1.2a |
| `/api/repricing/*` | Medium | Medium | Medium | 1.2a |

---

## Dependencies Analysis

### resolveActor Middleware
- **Location:** `src/lib/middleware/resolve-actor.ts`
- **Status:** ✅ Implemented (CLI authentication)
- **Capability:** Handles both NextAuth session cookies and Bearer API keys
- **Usage:** Can be leveraged for tenant ID resolution

### Migration 0016 (API Keys)
- **Status:** ✅ Implemented
- **Capability:** API key authentication for CLI and agents
- **Relevance:** Provides alternative authentication path

### RLS Policies
- **Status:** ✅ Implemented (migration 0003)
- **Capability:** Tenant isolation at database level
- **Requirement:** All queries must use `withTenant()` context

---

## Risk Assessment by Route

### High Risk Routes
- **Risk:** Breaking core business logic
- **Impact:** Users cannot import products or manage listings
- **Mitigation:** Feature flags, comprehensive testing, gradual rollout

### Medium Risk Routes  
- **Risk:** Breaking auxiliary features (eBay integration, repricing)
- **Impact:** Degraded user experience but core functionality intact
- **Mitigation:** Monitoring, quick rollback capability

### Low Risk Routes
- **Risk:** Breaking non-essential features (AI, alerts, feedback)
- **Impact:** Minor user inconvenience
- **Mitigation:** Standard testing, monitoring

---

## Next Steps

1. **Immediate:** Begin with Phase 1.2a (low-risk routes)
2. **Validation:** Test auth guard implementation on low-risk routes first
3. **Learning:** Apply lessons learned to high-risk routes
4. **Monitoring:** Establish baseline metrics before migration
5. **Rollback:** Prepare rollback procedures for each phase
