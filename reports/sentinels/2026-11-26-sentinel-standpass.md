# Sentinel weekly standpass — 2026-11-26

**Issue:** none ready — live queue check returned 0 `team: sentinels` + `ready` issues; running standing security rotation (§6).
**Branch:** workers/sentinels/sentinel-standpass-2026-11-26 off origin/master b8a4c21 (sweep #134).

**What scanned:** secrets in src/ + scripts/; unsafe patterns / missing auth / RLS gaps; dependencies via npm audit; error register ERR-000–ERR-069; patterns 1–23 in .logs/patterns.md.

**Findings (all pre-existing and tracked, confirmed still present on master):**
- ERR-066 HIGH — Pass 1 review: OAuth state never compared against stored value (src/app/api/ebay/authorize/route.ts:116-121); publish URL lacks offerId (src/lib/adapters/ebay/ebay-client.ts:272). Fixes on team/builders (PRs #134/#126), pending team→master.
- ERR-063 HIGH — dev CredentialsProvider has no NODE_ENV guard; DEV_TENANT_ID falls back to non-UUID tenant_dev_001 (src/lib/auth/config.ts:12-32). Fix on team/builders (PR #135), pending team→master.
- ERR-016 HIGH — /api/admin/beta-users GET/POST/PATCH has no session guard or 401 (no getAuthenticatedTenantId). Fix on team/builders (PR #103), pending team→master.
- ERR-065 MEDIUM — CSV title/description/identifiers copied with trim() only, no sanitization (src/lib/adapters/normalize.ts:280-286).
- next@14.2.5 HIGH — GHSA-gp8f-8m3g-qvj9 unpatched; fix path 14.2.35 (ERR-042).
- next-auth@4.24.7 MEDIUM — upgrade to 4.24.15 only on team/builders (PR #102).

**Dependency watch:** npm audit live re-verified: 31 vulnerabilities (4 critical, 15 high, 11 moderate, 1 low). Prior carried counts (84 full / 67 omit-dev) could not be re-verified until now.

**Secret scan:** clean — 0 real-secret hits; only dummy/test fixtures.

**Checks:** npm ci 862 pkg clean; npm test 126 passed / 3 skipped / 0 failures (4 pre-existing DATABASE_URL-unloadable files); tsc --noEmit 0; lint 0; build exit 0.

**PR:** staged into team/sentinels (this PR).

**Loose ends:** board check-in entry not pushed to GitHub (544 KB board file cannot be rebuilt through available tools; local git push has no non-interactive credential). team→master consolidation still pending for the team/builders fixes above.

**Severity:** no new confirmed vulnerabilities; no [ALERT] warranted.
