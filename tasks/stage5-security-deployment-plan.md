# Stage 5 Security Gates and Deployment Plan

**Status:** Planning Phase  
**Date:** 2026-08-16  
**Priority:** HIGH - Blocks Stage 5 expansion

---

## Audit Summary

**Completed Actions:**
- ✅ Fixed ERR-019 documentation inconsistency (UI recovery gate resolved)
- ✅ Updated error log and todo.md to reflect actual completion status
- ✅ Reviewed Stage 5 security gates and deployment requirements

**Current State:**
- Stages 1-4: Fully completed
- CLI & API Keys: Implemented (migration 0016, CLI tool)
- UI Foundation: Recovered and operational
- Dashboard: Rebuilt with real API integration

---

## Critical Gaps Blocking Stage 5

### 1. API Authorization & Tenancy (ERR-016)

**Current Issue:**
- 20+ API routes still use `DEV_TENANT_ID` hardcoded fallback
- Only dashboard layout performs session redirect
- API routes lack route-level session/RBAC checks
- Direct `db.query` calls bypass `withTenant()`/RLS context

**Affected Routes:**
- `/api/ai/analyze`, `/api/ai/rewrite`
- `/api/alerts`, `/api/dashboard/metrics`
- `/api/ebay/*` (authorize, export, submit, webhook)
- `/api/feedback`
- `/api/jobs/*` (activity, retry, individual jobs)
- `/api/listings/*`
- `/api/products/*`
- `/api/repricing/*`

**Required Actions:**
1. Implement shared server-side auth/RBAC guard middleware
2. Replace all `DEV_TENANT_ID` with session-derived tenant IDs
3. Add route-level session validation
4. Ensure all DB queries use `withTenant()` context
5. Add cross-tenant integration tests

### 2. Deployment Infrastructure (ERR-020)

**Current Issue:**
- Only local development Docker Compose exists
- No production Dockerfile
- No worker service in Compose
- No remote deployment configuration
- No production health checks

**Required Actions:**
1. Create production Dockerfile (separate from Dockerfile.dev)
2. Add worker service to production Compose
3. Configure production health checks
4. Implement secure secrets management
5. Add backups/restore procedures
6. Document rollback instructions
7. Select container-capable host (VPS/Fly.io/Railway/Render)

### 3. Dependency Security (ERR-008)

**Current Issue:**
- 19 vulnerabilities (3 critical, 10 high, 5 moderate, 1 low)
- Critical: Vitest RCE vulnerabilities
- High: PostCSS XSS/path traversal, Vite path traversal, Playwright

**Required Actions:**
1. Update dependencies to secure versions
2. Run security audit before production deployment
3. Implement dependency update process

---

## Stage 5 Implementation Plan

### Phase 0: Pre-Implementation Validation (Days 1-2)

**0.1 Current State Audit**
- Complete inventory of all `DEV_TENANT_ID` usage locations
- Document current authentication flow and dependencies
- Create baseline performance metrics for API routes
- Backup current database and configuration

**0.2 Test Environment Setup**
- Create dedicated staging environment
- Set up monitoring and alerting for auth failures
- Establish rollback procedures and test them
- Create feature flag system for gradual rollout

**0.3 Risk Assessment**
- Document critical vs non-critical API routes
- Identify routes that can be migrated safely vs those requiring careful coordination
- Create dependency graph of tenant ID usage

### Phase 1: Security Hardening (Week 1-2)

**1.1 Shared Auth Middleware**
- Create `src/lib/middleware/auth-guard.ts`
- Implement session validation
- Add RBAC checks (owner, va, accountant roles)
- Integrate with existing `resolveActor` middleware

**1.2 Tenant ID Migration (Split into 1.2a and 1.2b)**
- **1.2a Low-Risk Routes First** (non-critical routes)
  - Replace `DEV_TENANT_ID` in `/api/feedback`, `/api/alerts`
  - Use `resolveActor` for tenant resolution
  - Add fallback error for unauthenticated requests
  - Update test mocks to use session-derived IDs
  - Monitor for errors and performance impact
- **1.2b High-Risk Routes** (critical business logic)
  - Replace `DEV_TENANT_ID` in `/api/products`, `/api/listings`, `/api/jobs`
  - Implement feature flags for gradual rollout
  - Add comprehensive error handling
  - Update all dependent tests

**1.3 Database Context Enforcement**
- Audit all direct `db.query` calls
- Convert to `withTenant()` pattern
- Add RLS verification tests
- Document tenant isolation patterns

**1.4 Cross-Tenant Testing**
- Create integration tests using `ghostcart_app` role
- Test tenant isolation across all queries
- Verify RLS policies enforce boundaries
- Add tenant-switching test scenarios

**1.5 Performance Impact Analysis**
- Benchmark API routes before and after auth guard implementation
- Monitor latency impact from additional session validation
- Implement caching where appropriate to mitigate performance impact
- Document acceptable performance thresholds

### Phase 2: Deployment Infrastructure (Week 3-4)

**2.1 Production Dockerfile**
- Create `Dockerfile.prod` with production optimizations
- Separate web and worker processes
- Implement health check endpoints
- Configure secure environment variable handling

**2.2 Production Compose Configuration**
- Add worker service to `docker-compose.prod.yml`
- Configure production PostgreSQL settings
- Add Redis persistence configuration
- Implement secrets management (age encryption)

**2.3 Host Selection & Configuration**
- Evaluate container-capable hosts (DigitalOcean, Fly.io, Railway, Render)
- Select based on cost, performance, and deployment complexity
- Configure CI/CD pipeline
- Set up monitoring and alerting

**2.4 Backup & Recovery**
- Test backup/restore procedures in non-production environment
- Document backup schedules and retention policies
- Implement automated backup verification
- Create disaster recovery runbook

**2.5 Staging Environment Testing**
- Deploy production Docker infrastructure to staging
- Run full integration test suite in staging
- Test deployment pipeline end-to-end
- Validate rollback procedures in staging environment
- Load test staging environment with realistic traffic

### Phase 3: Security Certification (Week 5)

**3.1 Dependency Security**
- Update all vulnerable dependencies
- Run `npm audit` with zero vulnerabilities
- Implement dependency update process
- Add security audit to CI pipeline

**3.2 Production Readiness Checklist**
- [ ] All DEV_TENANT_ID removed
- [ ] Server-side auth/RBAC guard active
- [ ] Tenant isolation certified
- [ ] Production Dockerfile created
- [ ] Worker service configured
- [ ] Health checks implemented
- [ ] Secrets management active
- [ ] Backup/restore tested
- [ ] Zero dependency vulnerabilities
- [ ] CI/CD pipeline configured
- [ ] Staging environment validated
- [ ] Performance benchmarks met
- [ ] Rollback procedures tested

---

## Risk Assessment & Mitigation

| Risk | Severity | Likelihood | Impact | Mitigation Strategy |
|---|---|---|---|---|
| Breaking API routes during tenant ID migration | High | Medium | Critical | Phase 1.2a/1.2b split, feature flags, comprehensive testing |
| Performance degradation from auth checks | Medium | High | Medium | Phase 1.5 performance analysis, caching, monitoring |
| Production deployment failures | High | Low | Critical | Phase 2.5 staging testing, rollback procedures |
| Tenant isolation bypass | Critical | Low | Critical | Phase 1.4 cross-tenant testing, RLS verification |
| Dependency update breaking changes | Medium | Medium | Medium | Phase 3.1 staged updates, rollback testing |

---

## Rollback Procedures

### Phase 1 Rollback (Auth Guard Issues)
1. Disable feature flags for auth guard
2. Revert to `DEV_TENANT_ID` fallback temporarily
3. Restore previous API route versions from git
4. Monitor for authentication errors
5. Investigate root cause before retry

### Phase 2 Rollback (Deployment Issues)
1. Switch traffic back to previous deployment
2. Restore database from pre-deployment backup
3. Revert Docker Compose configuration
4. Validate rollback with smoke tests
5. Document incident for post-mortem

### Phase 3 Rollback (Dependency Issues)
1. Revert package.json to previous versions
2. Run `npm install` with locked versions
3. Verify application functionality
4. Test vulnerable dependencies in isolation
5. Plan alternative security mitigations

---

## Testing Strategy

### Tenant Isolation Test Suite
- Test 1: User from Tenant A cannot access Tenant B data
- Test 2: Admin from Tenant A cannot modify Tenant B data
- Test 3: API key from Tenant A only accesses Tenant A resources
- Test 4: Session timeout properly invalidates tenant context
- Test 5: Concurrent requests maintain proper tenant isolation

### Auth Guard Validation Tests
- Test 1: Unauthenticated requests return 401
- Test 2: Invalid session tokens return 403
- Test 3: Role-based access control enforcement
- Test 4: API key authentication bypasses session check
- Test 5: Rate limiting per tenant, not global

### Performance Benchmark Tests
- Test 1: API latency before/after auth guard (target: <50ms increase)
- Test 2: Database query performance with RLS (target: <20% overhead)
- Test 3: Concurrent session validation (target: handle 1000 req/s)
- Test 4: Memory usage with auth middleware (target: <10% increase)
- Test 5: Worker process performance with tenant context

---

## Success Criteria

**Security Gates:**
- ✅ No `DEV_TENANT_ID` in production code
- ✅ All API routes use session-derived tenant IDs
- ✅ Server-side auth/RBAC guard active
- ✅ Tenant isolation certified via integration tests

**Deployment Gates:**
- ✅ Production Dockerfile created and tested
- ✅ Worker service operational
- ✅ Health checks passing
- ✅ Secure secrets management
- ✅ Backup/restore procedures verified
- ✅ Zero critical/high vulnerabilities

**Test Gates:**
- ✅ Cross-tenant API tests passing
- ✅ RLS enforcement verified
- ✅ Production deployment tested in staging
- ✅ Rollback procedures validated

---

## Next Steps

1. **Immediate:** Begin Phase 0.1 - Complete inventory of all DEV_TENANT_ID usage locations
2. **Day 1-2:** Complete Phase 0 - Pre-implementation validation and risk assessment
3. **Week 1:** Begin Phase 1.1 - Create shared auth middleware
4. **Week 1-2:** Complete Phase 1.2a (low-risk routes) and 1.2b (high-risk routes)
5. **Week 2:** Implement Phase 1.3-1.5 - Database context, testing, and performance analysis
6. **Week 3-4:** Create production Docker infrastructure and staging testing
7. **Week 5:** Security certification and production readiness validation

---

## Dependencies & Blockers

**Dependencies:**
- Existing `resolveActor` middleware (CLI authentication)
- Migration 0016 (API keys table)
- Current RLS policies in migrations

**Blockers:**
- None identified - can proceed immediately

**Risks:**
- Breaking changes to API routes during tenant ID migration
- Production deployment complexity
- Potential performance impact from additional auth checks

**Mitigation:**
- Comprehensive testing before deployment
- Staged rollout (dev → staging → production)
- Performance monitoring during auth guard implementation
