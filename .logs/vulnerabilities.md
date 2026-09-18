# Security Vulnerability & Concern Register

This file logs security vulnerabilities, credential exposures, and compliance concerns discovered during security scans, code reviews, and dependency audits under **AOP-CORE v1.0**.

---

## 🔒 Active Vulnerability Register

| ID | Date Found | Severity | Component | Description | CVE / Reference | Status |
|---|---|---|---|---|---|---|
| SEC-005 | 2026-08-12 | Moderate | Telemetry | **Payload/Credentials Leakage in Logging** — Console log calls emit raw API request payloads (e.g. order details in eBay webhook, user keys). Risk of exposing access tokens, passwords, and PII in standard server logs. | AOP-CORE ERR-017 | ✅ RESOLVED — Implemented `src/lib/logger.ts` structured logger with auto-redaction rules and correlation ID bindings |
| SEC-007 | 2026-08-17 | High | Logging / webhooks | **Structured-logging boundary still not enforced.** `src/lib/logger.ts` exists, but some API routes still call raw console logs. | SEC-005 marked RESOLVED prematurely. | ⚠️ PENDING — Migrate remaining callers to structured logger with correlation IDs + auto-redaction. |
| SEC-008 | 2026-08-17 | Moderate | Secret hygiene (at rest) | **Plaintext API keys at rest** - Cline MCP config stores a Google API key and a Magic SDK key in cleartext. | Credential stored outside the app without vaulting. | ⚠️ PENDING — Move to env-secret/vault; reference by env var in MCP config. |
| SEC-013 | 2026-08-19 | High | Dependencies | **Next.js Self-Hosted Denial of Service (DoS)** — The `/_next/image` endpoint fails to enforce a maximum size limit, allowing an attacker to trigger out-of-memory errors by requesting excessively large external images. | GHSA-9g9p-9gw9-jx7f | ⚠️ PENDING — Requires upgrading Next.js to >= 15.5.10 (breaking change; requires React 19 / major framework migration) |
| SEC-014 | 2026-09-18 | High | eBay webhook tenancy | **Webhook tenant spoofing / cross-tenant write risk** — `src/app/api/ebay/webhook/route.ts` accepts `tenantId` from the signed payload and falls back to a fixed development tenant. A validly signed event must be mapped to a registered marketplace connection server-side; payload tenant data must not select the database tenant. | Audit finding | ✅ RESOLVED 2026-09-18 — Resolved tenant dynamically via `marketplace_connections` (seller ID / app ID / endpoint URL) via `resolveWebhookTenant`; rejects unmapped sellers with 404; removed payload `tenantId` trust and `DEV_TENANT_ID` fallback. |
| SEC-015 | 2026-09-18 | High | Admin API authorization | **Unauthenticated administrative endpoints** — `src/app/api/admin/beta-users/route.ts` and `src/app/api/admin/feature-flags/route.ts` directly query and mutate tenant/user/feature-flag data without `withAuthRoute`, `requireAuth`, or an owner/admin permission check. | Audit finding | ✅ RESOLVED 2026-09-18 (Cycle 1) — Added platform `admin` role to RBAC matrix (`auth-guard.ts`), wrapped GET/POST/PATCH in `withAuthRoute` + `requireRole(actor, 'admin')`; verified live: unauthenticated → 401 `UNAUTHORIZED`. Enrollment is DB-only (`UPDATE users SET role='admin' …`); `dev@ghostcart.local` promoted for dev verification. |
| SEC-016 | 2026-09-18 | High | Database / RLS | **App DB role is a superuser with `rolbypassrls = true` — all RLS policies are inert at runtime.** The `ghostcart` role (created via `POSTGRES_USER` in docker-compose) is `rolsuper = t` and `rolbypassrls = t`, so Postgres skips every tenant-isolation policy (`products_all_tenant`, `jobs_all_tenant`, etc.) for the application connection. Tenant isolation currently rests **entirely** on application-level `WHERE tenant_id = $1` clauses; any missed clause is a cross-tenant leak with no DB backstop. | Audit finding (psql `pg_roles`/`pg_class` inspection, 2026-09-18) | ⚠️ PENDING — Add a dedicated non-superuser application role (`ghostcart_app`, `rolbypassrls = false`) for the web/worker connections in docker-compose + prod; keep the superuser role for migrations only. Re-run the tenancy-isolation integration test under the restricted role. |

---

## 🛠️ Patched Vulnerability Archive

This archive documents all resolved vulnerabilities with their dates of resolution.

| ID | Date Found | Date Resolved | Severity | Component | Description | CVE / Reference | Resolution Details |
|---|---|---|---|---|---|---|---|
| SEC-001 | 2026-08-09 | 2026-08-19 | Critical | Dependencies | **Vitest Remote Code Execution (RCE)** — Vulnerabilities allow remote execution when running tests in environments loading untrusted config. | GHSA-9crc-q9x8-hgqq<br>GHSA-5xrq-8626-4rwp | Upgraded `vitest` dependency to `3.2.6`. |
| SEC-002 | 2026-08-09 | 2026-08-19 | High | Dependencies | **PostCSS XSS & Path Traversal** — Path traversal vulnerabilities in CSS parser imports and potential scripts injection during build step. | GHSA-qx2v-qp2m-jg93<br>GHSA-6g55-p6wh-862q | Upgraded parent project devDependencies and forced nested dependency resolutions to `8.5.26`. |
| SEC-003 | 2026-08-09 | 2026-08-19 | High | Dependencies | **Vite Path Traversal** — Server endpoints allow path traversal to fetch project-external files in development mode. | GHSA-4w7w-66w2-5vf9<br>GHSA-fx2h-pf6j-xcff | Upgraded `vite` to `6.4.3` via package overrides. |
| SEC-004 | 2026-08-12 | 2026-08-19 | High | API Security | **Authentication & Tenancy Bypass** — Direct API routes lack session checks, allowing operations using static tenant contexts (`DEV_TENANT_ID`). | AOP-CORE ERR-016 | Implemented `withAuthRoute`, `requirePermission`, and session-derived context mapping across all 20+ API routes. |
| SEC-006 | 2026-08-09 | 2026-08-19 | Moderate | Dependencies | **UUID Buffer Bounds Vulnerability** | GHSA-w5hq-g745-h8pq | Upgraded `uuid` dependency to `11.1.1` via overrides. |
| SEC-009 | 2026-08-19 | 2026-08-19 | Critical | Dependencies | **NextAuth Email Misdelivery & Normalization Homoglyph Bypass** | GHSA-5jpx-9hw9-2fx4<br>GHSA-7rqj-j65f-68wh | Upgraded `next-auth` to `4.24.15`. |
| SEC-010 | 2026-08-19 | 2026-08-19 | High | Dependencies | **Cookie Out-of-Bounds Parsing** | GHSA-pxg6-pf52-xh8x | Upgraded `cookie` to `^0.7.2` via overrides. |
| SEC-011 | 2026-08-19 | 2026-08-19 | Moderate | Dependencies | **Esbuild HTTP request hijacking** | GHSA-67mh-4wv8-2f99 | Upgraded `esbuild` to `^0.25.0` via overrides. |
| SEC-012 | 2026-08-19 | 2026-08-19 | High | Dependencies | **Glob CLI command injection** | GHSA-5j98-mcp5-4vw2 | Upgraded `glob` to `^11.0.1` via overrides. |

---

## 🛠️ Security Hardening Rules

1. **Credentials Management:**
   - Raw secrets (OAuth `accessToken`, `refreshToken`, `clientSecret`) must be vaulted at the database boundary and referenced in client scopes only by opaque handles (Valet Key pattern).
   - Never check `.env` files into version control. Ensure `.env.example` provides secure guidelines.

2. **Logging Boundaries:**
   - Avoid direct calls to `console.log`, `console.warn`, or `console.error`. Use the structured logger (`src/lib/logger.ts`).
   - All webhook entries must route through the redaction interceptor before telemetry emission.
