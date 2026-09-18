# Import Functions — Runtime & Browser Audit Report

**Date:** 2026-08-31
**Run budget:** ≤20 min
**Environment:** Windows sandbox, no Docker daemon running, Playwright chromium present but browser launch hung.

---

## 1. What was tested

| Layer | Method | Result |
|---|---|---|
| Import page (`/import`) | Attempted Playwright `import-workflow.spec.ts` | ⚠️ **Blocked** — browser launch hung >60s; no run completed |
| `GET /api/health` | curl / Invoke-WebRequest (dev server on :3000) | ❌ **HTTP=000 / timeout** — route opens `pg` Pool; no Postgres → hangs on connection |
| `POST /api/products` (invalid URL) | curl | ❌ **Time out** (same DB/auth dependency) |
| ImportForm unit contract | vitest `ImportForm.test.tsx` | ✅ Pass — payload matches `ProductImportSchema`, consumes `jobId` |
| Products API unit | vitest `products.test.ts` + `products-stage2.test.ts` | ✅ Pass (14/14 combined) |
| Adapter suites | vitest adapters | ✅ 36/36 |
| Static selector audit | grep `data-testid` across `src/` | ❌ **Zero** testids exist |

**Bottom line:** live browser testing was **environment-blocked** (no DB; sandbox browser launch), but the code-level audit isolated specific, actionable defects.

---

## 2. Actionable findings (each logged: ERR-037/038/039)

### 🔴 ERR-037 — E2E spec DOM contract mismatch (breaks the entire import E2E)
- `e2e/import-workflow.spec.ts` targets `input[name="url"]` — `ImportForm.tsx` renders the wrapper `Input` without `name="url"`.
- Asserts `[data-testid="import-success|error|duplicate-warning|product-list|activity-list"]` — **no `data-testid` exists anywhere in `src/`** (verified by grep). All 4 tests fail on the first missing locator.

### 🟠 ERR-039 — Import form UX lacks client validation + duplicate affordance
- No client-side URL validation: malformed URLs go to the server (validated correctly there by `ProductImportSchema` → 400), but the user gets no inline field error.
- Duplicate detection exists server-side (`checkDuplicateSourceUrl` → 409 "Duplicate import") but renders through the generic error block — no distinct "already imported" UX, no link to the existing product.

### 🟡 ERR-038 — Local runtime can't be smoke-tested without Docker
- Port 3000 listens, but DB-backed routes hang (no `ghostcart_db`/`ghostcart_redis`); Playwright couldn't launch chromium in the sandbox. Re-run required with Docker + migrate + worker.

---

## 3. Compiled TODO list (ready for review)

### P1 — E2E contract (fix before relying on `npm run test:e2e`)
- [E2E-1] Decide a single test-hook convention: **(a)** rewrite the spec to accessible queries (`getByLabel('Product URL')`, `getByText('Import queued')`, as `ImportForm.test.tsx` already does), or **(b)** add stable `data-testid`s. Recommend (a) + minimal testids where semantics aren't accessible.
- [E2E-2] Add `name="url"` to the URL `Input` (wrapper already supports `name`) + `aria-label` consistency.

### P2 — Import UX
- [UX-1] Client-side URL pre-validation (shared `isValidUrl` from `normalize.ts`) → inline error before fetch.
- [UX-2] Distinct duplicate card on 409 (amber, "Already imported", link to product) + "imported vs queued" wording on success.

### P3 — Verification infrastructure
- [OPS-1] Re-run live audit with `docker compose up -d db redis` + `npm run db:migrate` + `npm run dev` + worker via `npx tsx`; confirm `GET /api/health` 200, `/api/suppliers` 200, invalid-URL POST → 400, duplicate POST → 409.
- [OPS-2] Update `e2e/` `webServer` config (currently CI-only) + add `PLAYWRIGHT_BASE_URL` guidance; currently running E2E requires a manually-started server.
- [OPS-3] `npm run worker` script still uses `ts-node --esm` (crashes on Node ≥22) → switch to `npx tsx --env-file=.env src/worker/index.ts` (ERR-036 follow-up).

### P4 — Minor / hygiene (already known, carried forward)
- CSV/HTML adapters still use truncated base64 id scheme (prefix-collision risk; see pattern #21) — migrate to `airtableProductId`-style SHA-256 helper.
- Repo-wide `npm run lint` 341 pre-existing problems (ERR-025/SEC-007) remain.

---

## 4. Files logged/updated
- `.logs/errors.md` — ERR-037, ERR-038, ERR-039
- `tasks/todo.md` — changelog entry (2026-08-31 audit)
- No source code was changed during this audit (findings only, per plan-mode discipline for review).