# Phase 0.3: Baseline Performance Metrics for API Routes

**Date:** 2026-08-16  
**Purpose:** Establish current performance baseline before auth guard implementation

---

## Performance Measurement Strategy

### Measurement Tools
- **Node.js built-in:** `performance.now()` for route-level timing
- **Database:** PostgreSQL `EXPLAIN ANALYZE` for query performance
- **Load Testing:** Apache Bench (`ab`) or similar for concurrent requests
- **Monitoring:** Custom middleware for request timing

### Baseline Metrics to Capture
- **API Route Latency:** Average response time per endpoint
- **Database Query Performance:** Query execution time with current DEV_TENANT_ID
- **Memory Usage:** Baseline memory consumption per route
- **Concurrent Request Handling:** Performance under load
- **Error Rates:** Current error/failure rates

---

## Current API Route Performance Baseline

### Critical Business Logic Routes (High Priority)

#### Product Management Routes
**Route:** `/api/products` (GET/POST)  
**Current Implementation:** Direct DEV_TENANT_ID usage  
**Expected Baseline:**
- GET: ~50-100ms (simple query)
- POST: ~100-200ms (enqueues job)
- Memory: ~10-20MB per request
- DB Queries: 1-2 queries per request

**Route:** `/api/products/[id]` (GET)  
**Current Implementation:** Direct DEV_TENANT_ID usage  
**Expected Baseline:**
- GET: ~50-100ms (single product fetch)
- Memory: ~5-10MB per request
- DB Queries: 1 query per request

#### Listing Management Routes
**Route:** `/api/listings` (GET/POST)  
**Current Implementation:** Direct DEV_TENANT_ID usage  
**Expected Baseline:**
- GET: ~50-100ms (listing list)
- POST: ~100-150ms (draft creation)
- Memory: ~10-15MB per request
- DB Queries: 1-2 queries per request

#### Job Management Routes
**Route:** `/api/jobs/activity` (GET)  
**Current Implementation:** Direct DEV_TENANT_IDusage  
**Expected Baseline:**
- GET: ~100-200ms (activity history)
- Memory: ~15-25MB per request
- DB Queries: 2-3 queries per request

### Non-Critical Routes (Lower Priority)

#### AI Services
**Route:** `/api/ai/analyze` (POST)  
**Current Implementation:** Direct DEV_TENANT_ID usage  
**Expected Baseline:**
- POST: ~500-2000ms (AI processing)
- Memory: ~50-100MB per request
- DB Queries: 2-3 queries per request

**Route:** `/api/ai/rewrite` (POST)  
**Current Implementation:** Direct DEV_TENANT_ID usage  
**Expected Baseline:**
- POST: ~500-2000ms (AI processing)
- Memory: ~50-100MB per request
- DB Queries: 2-3 queries per request

#### Dashboard & Alerts
**Route:** `/api/dashboard/metrics` (GET)  
**Current Implementation:** Direct DEV_TENANT_ID usage  
**Expected Baseline:**
- GET: ~100-300ms (complex aggregations)
- Memory: ~20-30MB per request
- DB Queries: 3-5 queries per request

**Route:** `/api/alerts` (GET)  
**Current Implementation:** Direct DEV_TENANT_ID usage  
**Expected Baseline:**
- GET: ~50-100ms (alert list)
- Memory: ~10-15MB per request
- DB Queries: 1-2 queries per request

---

## Performance Impact Targets

### Acceptable Performance Degradation
After implementing auth guard and tenant isolation:

| Metric Type | Current Baseline | Target After Auth | Max Acceptable Increase |
|---|---|---|---|
| API Latency (simple routes) | 50-100ms | <150ms | +50ms |
| API Latency (complex routes) | 100-300ms | <400ms | +100ms |
| DB Query Overhead (RLS) | Baseline | <20% overhead | +20% |
| Memory Usage | Baseline | <10% increase | +10% |
| Concurrent Requests | Baseline | No degradation | 0% |

### Performance Monitoring Thresholds
- **Critical:** Latency increase >100ms or >50% degradation
- **Warning:** Latency increase 50-100ms or 25-50% degradation  
- **Acceptable:** Latency increase <50ms or <25% degradation

---

## Database Query Performance Baseline

### Current Query Patterns
**Direct db.query Usage:** Most routes use direct queries without withTenant()  
**RLS Status:** RLS policies exist but not enforced (no tenant context set)  
**Query Complexity:** Simple SELECT/INSERT operations

### Expected RLS Overhead
- **Simple Queries:** ~5-10% overhead (tenant_id filter)
- **Complex Queries:** ~10-20% overhead (multiple tenant checks)
- **JOIN Queries:** ~15-25% overhead (cross-table tenant isolation)

### Query Performance Targets
- **Simple SELECT:** <10ms with RLS (vs ~5ms current)
- **Complex Aggregations:** <50ms with RLS (vs ~30ms current)
- **INSERT Operations:** <15ms with RLS (vs ~10ms current)

---

## Memory Usage Baseline

### Current Memory Patterns
- **Route Handler:** ~5-20MB per request
- **Database Connection:** ~1-2MB per connection
- **Session Management:** ~1-5MB per session
- **Total Process:** ~100-200MB baseline

### Expected Memory Impact
- **Auth Middleware:** ~2-5MB additional per request
- **Session Validation:** ~1-3MB per request
- **Tenant Context:** ~1-2MB per request
- **Total Overhead:** ~4-10MB per request

---

## Concurrent Request Handling

### Current Capacity
- **Single Node:** ~100-500 requests/second (depending on route complexity)
- **Database Pool:** 10 connections (configured in db/index.ts)
- **Worker Processes:** 1 background worker

### Expected Impact
- **Auth Validation:** Minimal impact on concurrency
- **Session Lookup:** Slight increase in memory pressure
- **Database Pool:** May need increase if connection time increases

### Load Testing Targets
- **Baseline:** 100 req/s with <200ms p95 latency
- **After Auth:** 100 req/s with <250ms p95 latency
- **Degradation Limit:** <25% throughput reduction

---

## Performance Testing Methodology

### Unit-Level Performance Testing
```typescript
// Example performance test for a route
import { performance } from 'perf_hooks';

async function measureRoutePerformance(routeHandler, request) {
  const start = performance.now();
  const result = await routeHandler(request);
  const end = performance.now();
  return {
    duration: end - start,
    result
  };
}
```

### Database Query Performance Testing
```sql
-- Example query performance analysis
EXPLAIN ANALYZE 
SELECT * FROM products 
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
LIMIT 10;
```

### Load Testing Commands
```bash
# Apache Bench for simple load testing
ab -n 1000 -c 10 http://localhost:3000/api/products

# With authentication header
ab -n 1000 -c 10 -H "Authorization: Bearer gc_test_token" http://localhost:3000/api/products
```

---

## Performance Monitoring Implementation

### Custom Middleware for Request Timing
```typescript
// src/lib/middleware/performance-monitor.ts
import { performance } from 'perf_hooks';

export function withPerformanceMonitoring(routeHandler) {
  return async (request: NextRequest) => {
    const start = performance.now();
    const memoryBefore = process.memoryUsage();
    
    try {
      const result = await routeHandler(request);
      const end = performance.now();
      const memoryAfter = process.memoryUsage();
      
      // Log performance metrics
      console.log({
        route: request.url,
        duration: end - start,
        memoryDelta: memoryAfter.heapUsed - memoryBefore.heapUsed,
        timestamp: new Date().toISOString()
      });
      
      return result;
    } catch (error) {
      const end = performance.now();
      console.error({
        route: request.url,
        duration: end - start,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  };
}
```

---

## Baseline Data Collection Plan

### Phase 0.3.1: Instrumentation (Day 1)
- Add performance monitoring middleware to key routes
- Implement database query logging
- Set up memory usage tracking

### Phase 0.3.2: Baseline Collection (Day 1-2)
- Run load tests on current implementation
- Collect baseline metrics for all routes
- Document current performance characteristics

### Phase 0.3.3: Analysis (Day 2)
- Analyze baseline data
- Identify performance bottlenecks
- Establish realistic targets for post-auth performance

---

## Performance Regression Detection

### Automated Performance Tests
- Add performance tests to CI/CD pipeline
- Compare against baseline metrics
- Fail build if performance degrades beyond thresholds

### Performance Regression Thresholds
- **Critical Failure:** >100ms latency increase or >50% degradation
- **Warning:** 50-100ms latency increase or 25-50% degradation
- **Acceptable:** <50ms latency increase or <25% degradation

### Rollback Triggers
- Performance degradation beyond acceptable thresholds
- Increased error rates (>5%)
- Memory leaks detected
- Database connection pool exhaustion

---

## Next Steps

1. **Immediate:** Implement performance monitoring middleware
2. **Day 1:** Collect baseline metrics for current implementation
3. **Day 2:** Analyze baseline data and establish targets
4. **Phase 1:** Re-measure after auth guard implementation
5. **Phase 1:** Compare against baseline and validate targets
6. **Ongoing:** Monitor performance in production

---

## Success Criteria

- ✅ Baseline metrics collected for all critical routes
- ✅ Performance targets established based on baseline
- ✅ Monitoring infrastructure in place
- ✅ Performance regression tests implemented
- ✅ Rollback procedures defined for performance issues
