# Security Vulnerability & Concern Register

This file logs security vulnerabilities, credential exposures, and compliance concerns discovered during security scans, code reviews, and dependency audits under **AOP-CORE v1.0**.

---

## 🔒 Active Vulnerability Register

| ID | Date Found | Severity | Component | Description | CVE / Reference | Status |
|---|---|---|---|---|---|---|
| SEC-001 | 2026-08-09 | Critical | Dependencies | **Vitest Remote Code Execution (RCE)** — Vulnerabilities allow remote execution when running tests in environments loading untrusted config. | GHSA-9crc-q9x8-hgqq<br>GHSA-5xrq-8626-4rwp | ⚠️ PENDING — Requires upgrading Vitest to >= 1.4.0 (currently locked by package configurations) |
| SEC-002 | 2026-08-09 | High | Dependencies | **PostCSS XSS & Path Traversal** — Path traversal vulnerabilities in CSS parser imports and potential scripts injection during build step. | GHSA-qx2v-qp2m-jg93<br>GHSA-6g55-p6wh-862q | ⚠️ PENDING — Upgrade PostCSS to >= 8.4.38 |
| SEC-003 | 2026-08-09 | High | Dependencies | **Vite Path Traversal** — Server endpoints allow path traversal to fetch project-external files in development mode. | GHSA-4w7w-66w2-5vf9<br>GHSA-fx2h-pf6j-xcff | ⚠️ PENDING — Upgrade Vite to >= 5.2.11 |
| SEC-004 | 2026-08-12 | High | API Security | **Authentication & Tenancy Bypass** — Direct API routes lack session checks, allowing operations using static tenant contexts (`DEV_TENANT_ID`). Under `/api/admin/beta-users`, direct caller-supplied parameter inputs could allow tenant/user context spoofing. | AOP-CORE ERR-016 | ⚠️ PENDING — Implement server-side session guards and session-derived GUC context mappings |
| SEC-005 | 2026-08-12 | Moderate | Telemetry | **Payload/Credentials Leakage in Logging** — Console log calls emit raw API request payloads (e.g. order details in eBay webhook, user keys). Risk of exposing access tokens, passwords, and PII in standard server logs. | AOP-CORE ERR-017 | ✅ RESOLVED — Implemented `src/lib/logger.ts` structured logger with auto-redaction rules and correlation ID bindings |
| SEC-006 | 2026-08-09 | Moderate | Dependencies | **UUID Buffer Bounds Vulnerability** | GHSA-w5hq-g745-h8pq | ⚠️ PENDING — Upgrade UUID dependency |

| SEC-007 | 2026-08-17 | High | Logging / webhooks | **Structured-logging boundary still not enforced (contradicts SEC-005).** src/lib/logger.ts exists, but 40 files (all modern API routes incl. /api/ebay/webhook, /api/jobs/*, /api/products/**, src/worker/index.ts, libs) still call raw console.* and /api/ebay/webhook:151 logs the full order payload. | SEC-005 marked RESOLVED prematurely; logger not adopted across callers. | PENDING - Reopen SEC-005; migrate remaining callers to structured logger with correlation IDs + auto-redaction. |
| SEC-008 | 2026-08-17 | Moderate | Secret hygiene (at rest) | **Plaintext API keys at rest** - Cline MCP config (AppData Roaming Code User globalStorage saoudrizwan.claude-dev settings cline_mcp_settings.json) stores a Google API key (stitch server) and a Magic SDK key in cleartext. | Credential stored outside the app without vaulting; not covered by env rotation. | PENDING - Move to env-secret/vault; rotate both keys; reference by env var in MCP config. |
---

## 🛠️ Security Hardening Rules

1. **Credentials Management:**
   - Raw secrets (OAuth `accessToken`, `refreshToken`, `clientSecret`) must be vaulted at the database boundary and referenced in client scopes only by opaque handles (Valet Key pattern).
   - Never check `.env` files into version control. Ensure `.env.example` provides secure guidelines.

2. **Logging Boundaries:**
   - Avoid direct calls to `console.log`, `console.warn`, or `console.error`. Use the structured logger (`src/lib/logger.ts`).
   - All webhook entries must route through the redaction interceptor before telemetry emission.
