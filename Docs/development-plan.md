# Development Plan — GhostCart to Functional

**Owner:** Lead Engineer (Lotus), under product owner Cruze.
**Established:** 2026-10-23. **Coordination:** all work is assigned and tracked via `Docs/agent-job-board.md` — read it first.
**Evidence base:** `Docs/connector-scan-report-2026-10-22.md` (Parts 1–3) and `.logs/errors.md` ERR-021 → ERR-037.
**Product source of truth:** Production Blueprint & Delivery Guide (thin vertical slice). Where `tasks/plan.md` (Kafka/microservices vision) conflicts with the Blueprint's modular-monolith reality, the Blueprint and this plan win.
**Standing rule:** official/supported APIs first — AliExpress Open Platform, eBay Trading API. Jaydr-Scraper material is last-resort only, labeled, and only after the supported path is ruled out in writing on the Message Board.

## What "functional" means (the finish line for this plan)

A signed-in merchant can: (1) import a real AliExpress product via the Open Platform API into a normalized `CanonicalProduct`, (2) review/approve it, (3) see sold-comp pricing for it from Swanum/SoldStack, (4) generate a listing draft priced from that data, and (5) submit it to eBay through the Trading API (CSV export remains as fallback) — with tokens refreshing themselves and every step audit-logged. That is the thin vertical slice, working end-to-end with real connectors.

## Working agreements (all agents, all phases)

- **Small slices.** A task is sized to finish in one agent work session. If it can't be, it's two tasks — post on the board and the Lead re-slices. Atlas cap applies: prefer changes that stay surgical; big files get split work, not big edits.
- **Tests or it didn't happen.** Every implementation task ships with tests (fixtures over live calls; live calls are OWNER-GATED sessions). Lint + test suite green, or the task is not DONE.
- **No secrets in the repo.** Credentials arrive via environment / the encrypted-env pattern (`scripts/encrypt-env.sh`), never via commits, board posts, or logs. Tasks that need a live secret say OWNER-GATED and wait for Cruze.
- **One file, one modifier at a time** (AOP-CORE conflict rule). Claim on the board before editing shared files (`tasks/todo.md`, `.logs/*`, this plan, the board itself except Message Board appends).
- **Log as you go.** Task state → `tasks/todo.md`; changes → its Changelog section; errors & vulnerabilities → `.logs/errors.md`; recurring lessons → `.logs/patterns.md`.
- **Roadblock protocol.** Hit a wall twice → stop, post `[BLOCKED]` with evidence, and take the paired research task instead (each phase lists one). Research means: official docs first, then — labeled — analysis of how other maintained open-source projects solved the same problem. Strategy changes are the Lead's call, posted on the board. Never stack speculative fixes on an unverified guess.

---

## Phase 0 — Governance & config hygiene (Days 1–2)

Goal: the team machinery works and a fresh checkout can be configured correctly.

| ID | Task | Owner | Depends on | Acceptance |
|---|---|---|---|---|
| GC-100 | Adopt this plan + job board (post check-ins, confirm roles) | All agents | — | Check-in entries on the board from each active agent |
| GC-101 | Sync `.env.example` with every env var the code reads (`EBAY_DEV_ID`, `EBAY_RU_NAME`, `EBAY_ENVIRONMENT`, `EBAY_WEBHOOK_SECRET`, plus a full `process.env` sweep of `src/`, `scripts/`) | Jules | — | Diff touches only `.env.example`; GC-R1 review confirms no var missed, none invented |
| GC-102 | Credential-storage decision note (short ADR in `Docs/`): how connector secrets/tokens are stored — env/encrypted-env vs encrypted DB columns — covering ERR-029 | Lead drafts; Cruze decides | — | ADR posted; decision recorded in `tasks/todo.md` Decision Log |
| GC-103 | Fix `scripts/rotate-secrets.sh`: stop minting `EBAY_CERT_ID` via openssl; treat it as provider-issued (rotate at eBay portal, update env) | Jules | GC-102 | Script no longer generates a Cert ID; header comment explains the portal flow |
| GC-R1 | Review GC-101 (second-eyes verification against source) | Claude | GC-101 | `[REVIEW]` board entry listing what was checked |

## Phase 1 — AliExpress supplier adapter (the P0)

Goal: GhostCart imports real AliExpress products through the official API. Live-verified recipe (2026-10-17): HMAC-SHA256 signing (`sign_method=sha256`), gateway `https://api-sg.aliexpress.com/sync`, `session` param carries the OAuth token, `aliexpress.ds.text.search` with camelCase params (`countryCode`, `pageSize`, `pageNo`). Token lifetimes: access ~1 day, refresh ~2 days. App Secret is transient — never persisted.

| ID | Task | Owner | Depends on | Acceptance |
|---|---|---|---|---|
| GC-201 | Signer module `src/lib/adapters/aliexpress/sign.ts`: canonical param sorting + HMAC-SHA256 hex signature; unit tests with dummy secret incl. known-answer vectors computed independently | Jules | GC-101 | Tests green; signer is pure (no I/O, no env reads) |
| GC-202 | Token provider: holds app key + transient secret (env-injected), OAuth code exchange + refresh against `/auth/token/create` & refresh endpoints, expiry-aware (refresh when < 5 min to expiry, mirroring the SQL helper pattern in migration 0006) | Jules | GC-201, GC-102 | Unit tests with mocked HTTP; no secret or token written to DB/logs in plaintext |
| GC-203 | Search client: `aliexpress.ds.text.search` call layer (signed, session token, error-envelope parsing into typed errors, timeout + single retry) | Jules | GC-202 | Fixture tests (uses GC-T1 fixtures) cover success, empty, and error envelope |
| GC-T1 | Fixture pack: recorded-shape `ds.text.search` responses (full, empty, error) built from the scan report's verified field list | Codex | — | Fixtures committed under `src/__tests__/fixtures/` with a README noting provenance |
| GC-204 | Adapter: implement `ISupplierAdapter` (`validateConnection`, `importProduct`, `fetchProduct`) mapping search/detail data → `CanonicalProduct` via existing `normalize.ts` helpers; register `'aliexpress'` in `factory.ts` | Jules | GC-203 | Adapter tests green; `product.import` worker processes an AliExpress job end-to-end against fixtures |
| GC-205 | **OWNER-GATED live verification:** with Cruze present (fresh OAuth + transient secret), run one real search + one import; record results on the board | Lead + Jules | GC-204 | Board `[STATUS]` with product count/fields verified; secret discarded after session |
| GC-206 | Product detail + price/stock refresh: wire adapter `fetchProduct` into the existing `product.refresh` worker path | Jules | GC-204 | Refresh updates `supplierPriceCents`/`availability` + `price_history` in a fixture test |

*Roadblock research pairing:* if the token endpoints behave differently than documented, research task = re-read the official Open Platform auth docs and post a diff of doc-vs-observed behavior; do not improvise signing variants.

## Phase 2 — Worker scheduling (unblocks all refresh)

Goal: the runtime half of migration 0009 exists (ERR-031).

| ID | Task | Owner | Depends on | Acceptance |
|---|---|---|---|---|
| GC-301 | BullMQ repeatable-job scheduler in the worker + consumer for `scheduled_refreshes` rows (stock/price/both) | Jules | — | Test: a seeded schedule enqueues `product.refresh` at its cron expression |
| GC-302 | Register the missing `listing.submit` worker processor (queue exists, consumer doesn't) | Jules | — | Test: enqueued submit job is picked up and its failure path lands in DLQ |
| GC-303 | AliExpress token-refresh job (scheduled, uses GC-202 provider) | Jules | GC-202, GC-301 | Test: expired-token state triggers refresh; failure raises an alert event, not a crash loop |

## Phase 3 — Comps ingestion (Swanum → repricing → SoldStack)

Goal: pricing backed by sold data (scan Part 2; ERR-030).

| ID | Task | Owner | Depends on | Acceptance |
|---|---|---|---|---|
| GC-401 | Migration 0016: `comp_lookups` (provider, normalized query, params + hash, status ok/empty/error, result count, quota cost, raw JSONB, fetched_at) + `comp_stats` (summary incl. quartiles, days-to-sell, net payout, suggested max buy, by-condition JSONB, confidence, expires_at) + quota columns; RLS like other tenant tables | Jules (Archivist slot) | GC-102 | Migration applies cleanly on a fresh DB; RLS policies present |
| GC-402 | Swanum client (`src/lib/comps/`, `ICompsProvider`, `X-API-Key` from env) + `comps.pull` job with check-then-call against `comp_lookups` (fresh rows incl. `empty` are served from cache — no double burn) | Jules | GC-401 | Tests: cache hit makes zero HTTP calls; empty result writes lookup row, no stats row, negative-cache TTL honored |
| GC-403 | Wire `comp_stats.median` into repricing `generateSuggestion` as `competitorPriceCents` (the empty socket) + margin check display data | Jules | GC-402 | Test: suggestion uses comp median when present, behaves as today when absent |
| GC-404 | SoldStack client behind the quota ledger: persist response `usage` block after every call, hard stop at reserve floor (5), monthly reset on the 1st; 30-day TTL; on-listing-creation trigger only | Jules | GC-402 | Tests: quota-exhausted path refuses the call and logs why; usage persists |
| GC-405 | **OWNER-GATED:** Cruze supplies GhostCart's own Swanum/SoldStack keys via secure channel (never chat/board) into env | Lead + Cruze | GC-402 | Keys present in env only; board entry confirms presence, never values |

*Roadblock research pairing:* if response shapes differ from the agent-side connector docs, research task = capture one OWNER-GATED live response shape (fields only) and post a mapping diff.

## Phase 4 — eBay Trading API rebuild

Goal: replace the broken REST-OAuth foundation (ERR-022 → ERR-028) with the verified Trading path (user token, valid to Apr 2028).

| ID | Task | Owner | Depends on | Acceptance |
|---|---|---|---|---|
| GC-501 | Trading client skeleton (`src/lib/adapters/ebay/trading-client.ts`): XML build/parse (add an XML dependency), token injected from env (never DB plaintext), `GetTokenStatus` + `GetMyeBaySelling` reads | Jules | GC-102 | Fixture tests for request XML + response parsing; error taxonomy parsed, not raw-thrown |
| GC-502 | Real polling: implement `pollListings`/`pollOrders` on Trading reads (replaces the ERR-026 stub) | Jules | GC-501, GC-301 | Test: fixture response updates listings + polling state truthfully |
| GC-503 | Write path: `AddItem` using the existing mapper (aligned: real category IDs, condition IDs, GTC), stable persisted SKU/listing linkage, idempotent retry | Jules | GC-501 | Fixture tests; submit route uses Trading client; singleton now receives credentials (ERR-023 closed) |
| GC-504 | Lifecycle writes: `ReviseItem` (price/qty), `EndItem`, `RelistItem` + routes | Jules | GC-503 | Fixture tests per call |
| GC-505 | Webhook decision (ADR): rebuild to eBay's real ECDSA Event Notifications + challenge GET, or formally drop webhooks for polling-only | Lead drafts; Jules implements choice | GC-502 | ADR recorded; ERR-027 closed either way |
| GC-506 | **OWNER-GATED live verification:** token-status + active-listings read against the real account; then one sandbox-or-live `AddItem` only with Cruze's explicit go | Lead + Jules | GC-503 | Board `[STATUS]` with verified results; nothing listed without the go |

*Roadblock research pairing:* official Trading API docs first; if a payload shape is unclear, a labeled research task may analyze a maintained open-source Trading client — conclusions must cite the official doc field it confirms.

## Phase 5 — Hardening & standing maintenance (continuous)

Not a phase that ends — the rotation that fills idle time (job board §6).

- **RANGER sweep (weekly or per idle cycle):** secrets-pattern scan, auth/RLS review, OWASP Top 10 pass over new code; findings → board `[ALERT]` + `.logs/errors.md` register entries. First sweep: GC-S1 (already on the board).
- **Dependency Guardian (weekly):** `npm audit` + freshness pass; one upgrade proposal at a time with test evidence; flag new CVEs in dependencies we ship (Next.js, BullMQ, ioredis, pg, Puppeteer-adjacent tooling if any is ever adopted).
- **Janitor/Linkwarden (idle):** dead code, stale TODO markers (the AOP Discovery sweep), broken doc links.
- **Investigator (monthly):** mine `.logs/errors.md` for repeats → promote to `.logs/patterns.md`; report the top recurring cause on the board.
- Deferred by design (already in `tasks/todo.md`): SECURITY-DEBUG overlay, production deployment ADR (ERR-020), Stage 4+ automation. Not idle-time work until the Lead boards it.

## Sequencing summary

Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4, with Phase 5 running underneath from day one. Within a phase, tasks run in ID order unless the board says otherwise. The next phase does not start until the current phase's acceptance criteria are met or the Lead posts an explicit exception with reasoning.

*Plan version 1 — 2026-10-23. Changes to this plan are made by the Lead and noted in the `tasks/todo.md` changelog.*
