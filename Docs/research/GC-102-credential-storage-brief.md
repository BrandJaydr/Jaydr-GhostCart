# Research Brief: Credential Storage Architecture (GC-RS1 / GC-102)

**Author:** Minion 3 (LANE-5, Flex / Builder)
**Date:** 2026-10-24
**Target Audience:** Lead Software Engineer (Lotus) & Product Owner (Cruze)
**Related Issue / Task:** GC-102 (Credential-Storage ADR), ERR-029, ERR-011, Phase 0 in `Docs/development-plan.md`.

---

## 1. Executive Summary

GhostCart currently handles integration secrets (marketplace API keys, app certificates, OAuth tokens) through a hybrid of environment variables and PostgreSQL database tables. However, audits (`Docs/connector-scan-report-2026-10-22.md` and `.logs/errors.md` ERR-029) identified critical gaps:
1. `marketplace_connections` stores sensitive OAuth access and refresh tokens in unencrypted `TEXT` columns despite migration comments claiming they are encrypted.
2. `scripts/rotate-secrets.sh` incorrectly attempts to mint `EBAY_CERT_ID` via `openssl rand -hex 32` (provider-issued keys cannot be generated locally).
3. Secret lifetimes vary widely: platform credentials (`EBAY_APP_ID`, `EBAY_CERT_ID`, `ALIEXPRESS_APP_KEY`, `ALIEXPRESS_APP_SECRET`) are static and provider-issued, whereas OAuth user tokens (`access_token`, `refresh_token`) are dynamic per tenant with expiration dates.

This brief evaluates three realistic secret-management options against GhostCart’s operational constraints: a **modular monolith** deployment managed by a **phone-only product owner (Cruze)**.

---

## 2. Current State Analysis

### 2.1 Static Application Secrets
- **Location:** `.env` / `.env.example` / `.env.age` (`scripts/encrypt-env.sh`, `scripts/decrypt-env.sh`).
- **Mechanism:** Environment variables loaded at process start (`process.env.EBAY_APP_ID`, `process.env.ALIEXPRESS_APP_SECRET`). At-rest encryption for `.env` is supported via `age` (generating `.env.age`).
- **Strengths:** Simple, fast, native to Next.js / Node.js. Works seamlessly in Docker Compose or containerized cloud deployments.
- **Weaknesses:** Cannot store dynamic per-tenant tokens generated at runtime during OAuth authorize flows.

### 2.2 Dynamic Tenant Marketplace Credentials & Tokens
- **Location:** PostgreSQL table `marketplace_connections` (defined in `0001_init.sql` and expanded in `0006_ebay_integration.sql`).
- **Columns:** `app_id`, `cert_id`, `dev_id`, `ru_name`, `access_token`, `refresh_token`, `webhook_secret` (all typed as `TEXT`).
- **Defects Identified (ERR-029):**
  - Migration comment promises `(encrypted)`, but no encryption/decryption routines exist in the application layer or database layer.
  - `POST /api/ebay/authorize` writes raw plaintext tokens to the database.
  - Database backups or read-replica leaks would expose valid merchant access and refresh tokens.

### 2.3 Secret Rotation & Lifetime Mismatch
- **Rotation Script (`scripts/rotate-secrets.sh`):**
  - Rotates `NEXTAUTH_SECRET` and `POSTGRES_PASSWORD` properly via `openssl rand`.
  - Mismodels `EBAY_CERT_ID` as a locally rotatable secret; in reality, provider credentials must be rotated on the eBay Developer Portal and updated in `.env`.

---

## 3. Evaluation of Storage Options

### Option 1: Environment / Encrypted `.env` Only (Strict Env Separation)

In this option, static provider credentials (`APP_ID`, `CERT_ID`, `APP_SECRET`) live strictly in `.env` / `.env.age`. Dynamic merchant OAuth tokens are kept in-memory or single-session token managers and refreshed transiently.

* **Pros:**
  * Zero secret persistence in database tables; database compromise yields no API tokens.
  * Extremely simple setup; no DB crypto key management.
* **Cons:**
  * Cannot support multi-tenant SaaS where each tenant connects their own marketplace account with distinct OAuth tokens without redeploying env variables.
  * Server restarts clear active token state, forcing re-authentication unless persisted somewhere.
* **Fit for GhostCart:** Partial fit. Ideal for static provider keys (`EBAY_DEV_ID`, `ALIEXPRESS_APP_SECRET`), but insufficient for dynamic per-tenant OAuth tokens (`refresh_token`).

---

### Option 2: Application-Layer Authenticated Encryption for DB Columns (AES-256-GCM)

Static provider keys remain in `.env` (with `.env.age` at rest). Dynamic tenant tokens (`access_token`, `refresh_token`, `webhook_secret`) in `marketplace_connections` are encrypted before SQL `INSERT`/`UPDATE` using Node’s native `crypto` module (AES-256-GCM with unique IVs per field) using a single master encryption key (`ENCRYPTION_KEY`) stored in `.env`.

* **Pros:**
  * **Closes ERR-029 directly:** Database dumps or SQL injection (bypassing RLS) yield only ciphertext without the `.env` master key.
  * **Fully multi-tenant & dynamic:** Handles OAuth token refresh cycles seamlessly in Postgres.
  * **Zero extra infrastructure:** No external services or daemons required; runs natively inside the Next.js/Node runtime.
  * **Phone-owner friendly:** No complex CLI management. Setting one `ENCRYPTION_KEY` in deployment environment covers all tenant encryption automatically.
* **Cons:**
  * Requires a tiny cryptographic helper utility in `src/lib/crypto.ts` (`encrypt(text)`, `decrypt(text)`).
  * Key rotation for `ENCRYPTION_KEY` requires a re-encryption script for stored database columns.
* **Fit for GhostCart:** **Strongest fit.** Directly aligns with modular monolith design and phone-only owner requirements.

---

### Option 3: External Secret Store (e.g., HashiCorp Vault, AWS Secrets Manager, GCP Secret Manager)

Store both static credentials and dynamic tenant tokens in an external KMS or secret store service via REST/gRPC API.

* **Pros:**
  * Enterprise-grade audit logging, automatic rotation policies, strict access control policies (IAM/RBAC).
  * Centralized secret management across distributed microservices.
* **Cons:**
  * **Excessive complexity:** Introduces network latency on every API call, external billing/service dependencies, and extra infrastructure management.
  * **High operational burden for phone-only owner:** Managing Vault tokens, unseal keys, or cloud IAM roles from a phone is prone to lockouts and failure.
  * **Violates Blueprint Directives:** Over-engineering for a Stage 1–3 thin vertical slice.
* **Fit for GhostCart:** Poor fit. Deferred to Stage 6 (Scale / Enterprise) if ever needed.

---

## 4. Comparison Matrix

| Criteria | Option 1: Env Only | Option 2: Application AES-GCM in DB | Option 3: External Secret Store |
|---|---|---|---|
| **Multi-Tenant OAuth Token Support** | ❌ Poor (Requires restart/env edit) | ✅ Excellent (Dynamic DB updates) | ✅ Excellent |
| **Database Compromise Safety** | ✅ N/A (Not in DB) | ✅ High (Ciphertext only) | ✅ High (Not in DB) |
| **Operational Simplicity** | ✅ High | ✅ High | ❌ Low (High overhead) |
| **Infrastructure Overhead** | None | None | Additional service/cloud dependency |
| **Phone-Only Owner Fit** | High | **Ideal** | Poor |
| **Implementation Sizing** | Small | **Small (~1 file `crypto.ts`)** | Large |

---

## 5. Architectural Recommendation for GC-102

1. **Adopt Hybrid Two-Tier Credential Model:**
   - **Tier 1 (Static Provider Credentials):** Keep strictly in `.env` / `.env.age` (`EBAY_APP_ID`, `EBAY_CERT_ID`, `EBAY_DEV_ID`, `ALIEXPRESS_APP_KEY`, `ALIEXPRESS_APP_SECRET`). Never store in database.
   - **Tier 2 (Dynamic Tenant OAuth Tokens & Webhook Secrets):** Store in `marketplace_connections`, but encrypt `access_token`, `refresh_token`, and `webhook_secret` using **Application-Layer AES-256-GCM** with a master key (`ENCRYPTION_KEY` / `TOKEN_ENCRYPTION_KEY` in `.env`).

2. **Fix `scripts/rotate-secrets.sh`:**
   - Remove `openssl rand` generation for `EBAY_CERT_ID`. Update script comments to clarify that `EBAY_CERT_ID` and `ALIEXPRESS_APP_SECRET` must be rotated on developer portals and updated in `.env`.

3. **Implementation Effort:**
   - Creating `src/lib/crypto/encryption.ts` (using standard `crypto.createCipheriv('aes-256-gcm', key, iv)`) and updating `marketplace_connections` read/write handlers requires ~1 task (~50 lines of tested TypeScript).

---
