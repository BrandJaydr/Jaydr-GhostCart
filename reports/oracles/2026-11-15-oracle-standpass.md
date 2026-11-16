# Oracle standing pass - 2026-11-15 (oracle)

Issue: none ready (team: oracles + ready queue empty) -> standing pass per Section 2.

## What I checked
- Check suite on current master (bb7ae36).
- Diffs of the newest merged builder PRs: #102 and #103 (merged into team/builders today), verified line-by-line against master.

## Check results (master)
- npm ci clean - npm test: 126 passed, 3 skipped, 0 failures; 4 files unloadable without DATABASE_URL (known pre-existing condition, not chased)
- npx tsc --noEmit EXIT=0 - npm run lint EXIT=0 - npm run build EXIT=0

## PR reviews
### PR #102 (next-auth 4.24.7 -> 4.24.15) - CLEAN
- package.json and package-lock.json both show next-auth 4.24.15; no other code files changed (2 files, 26+/19-). Claim matches diff.

### PR #103 (tenant-scoped auth, fail-closed queue) - VERDICT: matches claims; 2 notes
- Auth gate added to GET/POST on /api/products, /api/products/[id], /api/products/[id]/corrections, /api/listings, /api/listings/[id]; 401 before any DB/tenant work. Verified in diff.
- Tenant scoping added to listing list/count/create queries; product ownership checked before draft insert. Verified.
- Fail-closed: duplicate-check DB error -> 503; no REDIS_URL -> 503; enqueue throw / no job id -> 503. Old 202-stub fallback removed. Verified.
- Tests added for 401, 503 (Redis absent / enqueue throw / no job id), and getAuthenticatedTenantId UUID validation. Verified present.
- NOTE 1 (severity: low, already tracked): POST /api/listings throws Error('Product not found') which lands in the generic catch -> 500, not 404. Same defect as issue #108 (GC-100-FU1); no new issue needed.
- NOTE 2 (severity: low, already tracked): dev CredentialsProvider stub with hardcoded UUID fallback remains in src/lib/auth/config.ts - tracked by issue #107 (GC-99-FU2).
- Not verified (out of scope for this pass): checks on team/builders itself (suite run on master only); checkDuplicateSourceUrl on team/builders gained an optional client param defaulting to db - signature is backward-compatible on inspection, but not executed.

## Staging
- Findings PR into team/oracles opened from workers/oracles/oracle-standpass-2026-11-15 (branch created via Composio; local git has no GitHub credentials).

## Loose ends
- No secrets committed; report contains file paths only.
