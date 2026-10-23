# Ghost Cart Connector Scan — Full Report

**Date:** 2026-10-22
**Scope:** `BrandJaydr/Jaydr-GhostCart` (primary), `BrandJaydr/Jaydr-Scraper` (research repo)
**Method:** Full `src/` tree traversal, all eBay adapter/route/migration files read end-to-end, docs and `TECHNICAL_WIKI.md` grepped, all 16 DB migrations inventoried. Caveat: GitHub code search returns `incomplete_results` for this repo, so findings rest on direct traversal and file reads, not search indexing. A few large dump files (`review-scan.txt`, test-output txts) did not return content through the API and were not line-scanned. Scan and report only — no code was changed by the audit itself.
**Standing rule applied (Cruze, 2026-10-22):** official/supported paths first (AliExpress Open Platform, eBay Trading API). The Jaydr-Scraper research repo is LAST priority as a source of solutions; anything drawn from it is labeled last-resort with the supported alternative named.

**Contents**
- Part 1 — AliExpress & eBay connector scan
- Part 2 — Statistical platform scan (Swanum Comps & SoldStack)
- Part 3 — AliExpress scraper test report (last-resort evaluation)
- Appendix — Error register index (entries appended to `.logs/errors.md`)

---

# Part 1 — AliExpress & eBay Connector Scan

**Headline:** AliExpress has *zero* code. eBay has a fair amount of code, but it's built on the one path already verified broken — and even on its own terms, the authorize → submit chain is disconnected, so it could never have completed a live listing.

## 1.1 AliExpress — nothing exists

**What exists today**
- Only mentions are in concept docs: the Project Concept lists AliExpress as a future Product Research source, and the Plan doc imagines AliExpress price-drop alerts plus *browser automation* for "some AliExpress stores." That's the old scraping idea, not the Open Platform API.
- `Jaydr-Scraper` holds two AliExpress scraper research write-ups (`comalex-aliexpress_parser`, `sudheer-ranga-aliexpress-product-scraper` — analysis/lessons docs only). Its README states plainly: runtime code not started, product adapters not started. No connector code there.
- The good news: the *receiving* architecture is real and reusable — `ISupplierAdapter` (`validateConnection / importProduct / fetchProduct`), the adapter factory, `normalize.ts` helpers, `CanonicalProduct`, and the worker's `product.import` / `product.refresh` jobs. An AliExpress adapter plugs into all of that with no worker changes.

**What's missing — everything platform-specific**
- No adapter: no `src/lib/adapters/aliexpress/`, factory registers only `mock` and `csv`, no `/api/aliexpress/*` routes, no AliExpress migration.
- No config: `.env.example` has no AliExpress vars at all (no app key, no token fields).
- No signing: HMAC-SHA256 request signing is implemented *nowhere* for AliExpress — the only HMAC in the codebase is in the eBay webhook handler (wrong context). No sorted-param signing, no `sign_method=sha256`, no `api-sg.aliexpress.com/sync` gateway, no `session` token parameter, no timestamp handling.
- No auth lifecycle: no OAuth authorize → code → `/auth/token/create` exchange, no token storage, and critically no refresh logic — with ~1-day access / ~2-day refresh lifetimes (verified live against Cruze's app, App Key 554194, Drop Shipping category), this connector dies daily without a proactive refresh job.
- No API calls: no `aliexpress.ds.text.search` (the one call verified live end-to-end on 2026-10-17, secret re-verified 2026-10-21), no product detail, shipping, or any `ds.order.*` fulfillment calls.
- No response mapping (`ds.text.search` result → `CanonicalProduct`), no AliExpress error-envelope parsing, no rate-limit wiring.
- Callback mismatch: the app's registered callback is a Notion placeholder page; the codebase has no callback route to receive an auth code anyway.
- Secret handling requirement: the App Secret must never be stored in code or files; it is supplied per session and used transiently. Nothing in the current codebase models that pattern.

## 1.2 eBay — code exists, built on the wrong foundation

**What exists today**
- `src/lib/adapters/ebay/ebay-client.ts` — REST OAuth 2.0 client: authorize URL, code exchange, refresh, in-memory token, Sell Inventory API listing flow (create inventory item → offer → publish), one status read, health check.
- `listing-mapper.ts` — the strongest file: title truncation, description formatting, validation, condition/category maps.
- API routes: `authorize`, `submit`, `webhook`, plus a CSV export fallback (which works independently of the API).
- Migration `0006_ebay_integration.sql` — `marketplace_connections` token columns, `webhook_events`, `polling_state`, and a SQL `needs_token_refresh` / `update_access_token` pair.
- Generic infrastructure that is genuinely solid: Redis sliding-window rate limiter (migration 0012), audit events on auth/submit, BullMQ worker, idempotency helpers.
- Tests: exactly one real one — the listing-mapper unit test. The eBay e2e spec is aspirational UI mocking.

**What's missing / wrong, in severity order**

1. **Wrong primary auth path.** The whole client is REST OAuth via eBay's hosted flow — the flow verified to fail platform-side ("something went wrong"). There is *no* Trading API anywhere: no XML layer, no Auth'n'Auth user-token support, no `GetTokenStatus` / `GetMyeBaySelling` (the two calls verified live with the `cruzsamue_0` user token, valid to Apr 2028). The client header even claims it "handles eBay Trading API calls" — it doesn't; it calls the Sell Inventory REST API.
2. **Authorize → submit is disconnected.** The authorize route stores tokens in the DB, but the submit route uses a singleton client that never loads them — `setToken()` is never called anywhere, and the token set during authorize lives on a throwaway instance. Submit would throw "No token available" even if OAuth had worked.
3. **Broken endpoints/payloads inside the REST flow itself:** authorize URL points at `api.ebay.com/identity/v1/authorize2` (real consent URL lives on the auth domain); publish calls `/sell/inventory/v1/publish_offer` (real: `/offer/{offerId}/publish`) and expects `itemId`/`viewItemURL` back (real response returns a listing ID); offer uses placeholder policy IDs `'default'` — no code fetches real fulfillment/payment/return policies or creates an inventory location; SKUs are `sku-${Date.now()}` generated per call and never persisted, so updates/relist/sync are impossible and retries duplicate.
4. **No reads or lifecycle operations.** No active-listing pull, orders, revise price/quantity, end, or relist. `polling-service.ts` is a stub: `pollListings` hardcodes `itemsProcessed = 0` and just updates the polling timestamp; its own comment admits the real `GetMyeBaySelling` call was never written.
5. **Webhooks implement a scheme eBay doesn't use.** Code verifies HMAC-SHA256 `sha256=<hex>` with a shared secret and handles invented event types (`ITEM_CREATED`, `ITEM_SOLD`). Real eBay Event Notifications use ECDSA verification plus a challenge-response GET handshake — neither exists, so no real eBay notification would ever verify.
6. **Token refresh is half-built.** Refresh exists in the client (in-memory only); the SQL refresh helpers are never called from TypeScript; nothing persists refreshed tokens, and the authorize callback hardcodes `environment = 'sandbox'` and lives on the wrong path (comment says `/authorize/callback`, no such route exists).
7. **Config gap:** code requires `EBAY_DEV_ID`, `EBAY_RU_NAME`, `EBAY_ENVIRONMENT`, `EBAY_WEBHOOK_SECRET`, but `.env.example` only lists `EBAY_APP_ID` / `EBAY_CERT_ID` — a fresh setup fails immediately. Default environment is sandbox.
8. **Secrets handling (design flag, not a leak):** No committed secret values were found in the files read — credentials come from env, `.env.example` is placeholders, and `scripts/rotate-secrets.sh` generates values rather than containing any (one pattern hit was a variable reference). *But* the authorize route stores app ID, cert ID, and access/refresh tokens as **plaintext** DB columns, despite the migration comment claiming they're encrypted — no encryption code exists on that path. Also, that rotate script tries to "generate a new eBay Cert ID" with `openssl rand` — eBay issues Cert IDs; you can't mint one locally.
9. **Missing plumbing in the client:** no retries/backoff, no 429 handling, no parsing of eBay's structured error responses (raw text is thrown), no rate-limiter calls despite the limiter existing, no logging beyond `console.error` in routes. `package.json` has no eBay SDK and no XML library — both needed for the Trading path.
10. **Mapper disconnect:** the mapper produces Trading-flavored fields (duration `GTC`, `FixedPriceItem`, category *names*) that `addListing` then ignores entirely — category, duration, and listing type never reach the API. It also maps price from supplier cost in one function and list price in the other.

## 1.3 Priority build list (Part 1)

- **P0 — AliExpress supplier adapter** (see recommended first task below).
- **P0 — eBay: rebuild on Trading API.** Add a Trading client (XML build/parse, user token injected from env/secure config — never DB plaintext), starting with the verified reads (`GetTokenStatus`, `GetMyeBaySelling`), then `AddItem` / `ReviseItem` / `EndItem` / `RelistItem` writes. Keep the REST client parked, don't extend it.
- **P1 — Fix the token plumbing pattern for both platforms:** one place that loads credentials, hands them to the client, persists refreshes, and encrypts at rest. This is the bug that silently killed the eBay flow.
- **P1 — AliExpress token refresh job** (daily cadence forced by the 1-day/2-day lifetimes) and `ds.product` detail + price/stock refresh into the existing `product.refresh` worker.
- **P2 — Real sync:** implement `pollListings` against Trading reads; drop or rebuild the webhook handler to eBay's actual ECDSA notification scheme; wire `checkIntegrationRateLimit` + retry/backoff into both clients; add `.env.example` entries for every var the code actually reads.
- **P2 — Tests:** client-level tests with recorded fixtures for both platforms (only the eBay mapper is tested today).

## 1.4 Recommended first task (Part 1)

**Build the AliExpress supplier adapter** — `src/lib/adapters/aliexpress/` implementing `ISupplierAdapter`: an HMAC-SHA256 signer, a token holder that takes the App Secret transiently from environment/session (never persisted), `aliexpress.ds.text.search` mapped into `CanonicalProduct`, registered in the factory, with fixture-based unit tests.

Why first: it's the only connector where the live recipe is fully verified (signing + search proven 2026-10-17, secret re-verified 2026-10-21), the surrounding architecture already works so it's a single-adapter job rather than a rebuild, and it produces the product imports that everything downstream — including any eBay listing path — depends on.

---

# Part 2 — Statistical Platform Scan (Swanum Comps & SoldStack)

**Headline:** There is *no* stats/comp ingestion of any kind — no client, no table, no job, no API-key config for either platform. The words Swanum and SoldStack appear nowhere in the repo. But there are two telling near-misses: downstream code that *expects* market data and has nothing feeding it.

Platform facts (verified live in the resellers workflow): Swanum Comps — sold-listing comps for eBay US and Vinted, `X-API-Key` header auth, free beta 10,000 requests/month at up to 5 req/sec; its sold history is still being built, so queries can legitimately return zero tracked sales. SoldStack — cleaned sold comps for Poshmark US/Canada, `X-API-Key` header auth, free tier 100 lookups/month resetting on the 1st; cached repeats and filter changes on a cached search do not consume extra lookups; responses carry a `usage` block (used/limit/remaining/resets).

## 2.1 What exists today

**Nothing platform-specific:**
- No HTTP client for either service, no `X-API-Key` handling, no env vars (`.env.example` has neither key), and no credentials for either in the repo — the keys exist only in Cruze's Secure Vault for the agent-side connectors, which Ghost Cart can't reach.
- No comps table. Full migration inventory (0001–0015): tenants/users, suppliers, products, listings, jobs, audit, price/margin/repricing/AI tables — nothing for sold comps, market stats, or provider lookups.
- No job type: the worker's `JobType` union is only `product.import | product.refresh | listing.submit`, the queue module defines only those two queues, and the worker has **no scheduler at all** — no repeat jobs, no cron, no interval timers.

**Adjacent pieces that look relevant but aren't (or are unwired):**
- `ai_insights.market_trends` (migration 0005) — a category-level JSONB trend bucket whose `source` column nominally allows `'external_api'`. Nothing writes external data to it; the AI client only talks to local model endpoints (localhost) and never touches this table. It's a placeholder, not a comps store — wrong shape anyway (category trends, not per-query sold stats).
- **Repricing engine** — `generateSuggestion` accepts an optional `competitorPriceCents`, and the SQL has a whole "beat competitor" branch. *Nothing in the codebase ever supplies that value.* This is the empty socket comps data is meant to plug into.
- `price_history` (0009) — tracks Ghost Cart's *own* product price changes. Not market data.
- `scheduled_refreshes` (0009) — a cron-expression table for stock/price refreshes, but the worker never reads it (zero references), and its type constraint (`stock | price | both` via supplier adapters) has no room for a comps refresh.
- `integration_rate_limits` (0012) + the rate limiter — per-integration request-rate config exists and is reusable, but that's requests-per-window throttling, not a monthly lookup *budget*. `usage-limits.ts` is likewise tenant-side (listings/day, AI calls) — nothing tracks a provider quota.

## 2.2 What automatic pulling would require

**Client layer (small):** Two thin GET clients — e.g. `src/lib/comps/swanum.ts` and `soldstack.ts` — each just base URL + query params + `X-API-Key` header. Model them as their own `ICompsProvider` interface, *not* as supplier adapters: comps are marketplace statistics, not supplier products, and forcing them through `ISupplierAdapter` would corrupt that contract. Keys supplied via environment (the encrypted `.env.age` script pattern already exists) — never DB columns; the eBay code's plaintext-token storage is the anti-pattern to avoid repeating.

**Job type:** A new `comps.pull` job (extend the `JobType` union, add a BullMQ queue following the existing pattern of 3 attempts / exponential backoff), processed in the worker. Two triggers:
- *On demand:* when a product is imported or a listing draft is created, enqueue a comp pull for that product's derived query (title/brand terms + marketplace).
- *Scheduled refresh:* a BullMQ repeatable job sweeping stale comps — this also means building the scheduler the worker currently lacks entirely.

**Storage shape (one migration, two tables):**
- `comp_lookups` — **the log**: provider, normalized query, params (site/source, window days, limit, condition), params hash, status (`ok | empty | error`), result count, quota cost, raw response JSONB, error detail, `fetched_at`. This is the direct equivalent of the resellers workflow's comp log (summary CSV + raw JSON folder), in database form.
- `comp_stats` — **the summary**: product/listing link, provider, marketplace, currency, count, median, mean, quartiles (Swanum p25/p75; SoldStack p10/p90), min/max, plus SoldStack's `median_days_to_sell`, `median_net_payout`, `suggested_max_buy`, `by_condition` JSONB, and `cleaning.confidence`; Swanum items can live as JSONB alongside. `fetched_at` + `expires_at` drive refresh decisions. This summary row is what feeds the repricing engine's `competitorPriceCents` (median) and margin checks.

**Refresh cadence, per platform (they're opposites):**
- **Swanum** (10,000/mo, 5 req/sec): refresh on import, then weekly for active listings; ~7-day TTL. Quota is a non-issue at current volume; still route through the existing integration rate limiter.
- **SoldStack** (100/mo, resets the 1st): on-demand at listing creation only, ~30-day TTL aligned to the monthly reset. Sold-comp medians over a 90-day window don't move fast enough to justify more. Never put SoldStack on a broad scheduled sweep.

**Error/empty handling — the critical distinction:** On Swanum, **zero tracked sales is a successful result, not an error** (its history is still being built by following listings). Design: status `empty`, write the lookup-log row, write *no* stats row, no retries, and negative-cache it — that query is not re-asked for at least 14–30 days. Separately: `401` = key/config failure, stop and alert, no retry; `429` = back off and respect it (SoldStack also rate-limits deep lookups); timeout = one retry, matching how the live connectors behave. SoldStack responses carry a `usage` block — persist `used / limit / remaining / resets` after every call as the quota source of truth.

## 2.3 Guardrails — the comp-log equivalent

The resellers rule is *check the log before you query, log every lookup so a limited query is never burned twice*. In Ghost Cart that becomes architecture, not habit:

- **Check-then-call lives in the worker:** before any outbound request, look up `comp_lookups` by provider + params hash; if a fresh row exists (inside TTL, including `empty` rows), serve from `comp_stats`/cache and make no call. A uniqueness constraint on (provider, params hash, TTL window) makes double-burns structurally hard, and the existing job idempotency helpers give the pattern.
- **Quota ledger for SoldStack:** a hard stop in the worker when remaining hits a reserve floor (keep ~5 in hand), driven by the persisted `usage` block, reset on the 1st. Swanum gets a simple monthly counter against 10,000.
- **Zero-value rule, adapted:** per Cruze's 2026-10-20 rule, an empty result writes no stats and triggers no downstream work — but the *attempt* is always logged. The log row is the guardrail itself; skipping it is how queries get burned twice.
- All of this belongs in the worker + the new migration — not in API routes, and not in the repricing engine (it should stay a pure consumer of `comp_stats`).

## 2.4 Prioritized additions, and ranking against Part 1

**Build order for comps:** (1) migration for `comp_lookups`/`comp_stats` + quota fields; (2) Swanum client + `comps.pull` worker with check-then-call; (3) wire `comp_stats.median` into repricing/margin; (4) SoldStack client behind the quota ledger; (5) scheduled refresh sweep.

**Overall ranking across Parts 1–2:**
1. **AliExpress adapter (Part 1 P0) — first.** It's the product inflow; comps for products you can't import yet are trivia.
2. **Comps ingestion (Part 2) — second, ahead of the eBay rebuild.** It's the cheapest build of the three by a wide margin: two plain GET+header APIs, no OAuth, no signing, no XML, no platform-side blockers — and Swanum's eBay US comps directly inform the listings you'll eventually push. It also completes code that already exists (the repricing engine's competitor slot has been sitting empty since it was written).
3. **eBay Trading API rebuild (Part 1 P0) — third.** Biggest lift, and it lands better *after* comps: when the write path works, pricing is already backed by sold data instead of supplier cost — which, as Part 1 noted, is what one of the current mapper functions would wrongly list at.

One honest trade-off: if the goal is a live selling loop fastest, eBay Trading *reads* could swap with #2 — but you'd be reading your listings into a platform that still can't price them from market data.

---

# Part 3 — AliExpress Scraper Test Report

**Classification (per standing rule): LAST-RESORT evaluation**, run at Cruze's direct request on 2026-10-22. The supported alternative — the official AliExpress Open Platform API — has *not* been ruled out; it is verified working (Part 1). Nothing in this part changes the build priorities in Parts 1–2.

## 3.1 What "the scraper work" is

Jaydr-Scraper contains no runnable connector code. Its AliExpress material is research analysis of two external projects:

- **`comalex/aliexpress_parser`** — Python (requests + BeautifulSoup), last updated 2022-07-06, 5 stars, spoofed User-Agent. The research itself flags it stale/abandoned.
- **`sudheer-ranga/aliexpress-product-scraper`** — Node.js npm package, Puppeteer + `puppeteer-extra-plugin-stealth`, API-response interception on client-rendered product pages, MIT license, actively maintained (v4.0.0 current). The research itself notes the stealth/evasion approach conflicts with the repo's own principles; Jaydr-Scraper's `SECURITY.md` names challenge pages and bot-management interstitials as **stop conditions** and excludes stealth/anti-detect tooling from scope.

The test below targeted the sudheer package — the only credible candidate. The comalex parser was **not run**: it predates AliExpress's switch from server-rendered pages to client-side rendering (the very change the v4 package was rewritten for), and the network wall in §3.3 is client-agnostic, so a run could only re-prove the same block.

## 3.2 Test setup and code inspection

- Environment: Node v24.22.1 (package requires ≥ 24 ✓), npm install of `aliexpress-product-scraper@4.0.0` completed cleanly (167 packages incl. Puppeteer's Chrome).
- Code inspected before execution: ~560 lines across `index.js` + `src/` (`aliexpressProductScraper.js`, `parsers.js`, `reviews.js`, `variants.js`, `shipping.js`, `transform.js`). The only outbound domains in the code are `www.aliexpress.com` (product + description pages in the browser) and `feedback.aliexpress.com` (reviews via `node-fetch`). No third-party endpoints, no telemetry, no exfiltration paths found.
- Flow: launch headless Chrome (stealth plugin), open `https://www.aliexpress.com/item/<id>.html` with `waitUntil: networkidle2`, intercept `mtop.aliexpress` *pdp* API responses (fallback: `window.runParams`), fetch description page in-browser, fetch reviews, transform to a single JSON product record.
- Test target: product ID `1005007429636284` — the package README's own documented example — with `reviewsCount: 2`, `timeout: 90000`.

## 3.3 What happened — environment hurdles, then the wall

Three VM-environment obstacles were encountered and worked through before AliExpress was ever reached (full error strings in the Appendix / `.logs/errors.md` ERR-032 → ERR-035):

1. Chrome refused to launch as root (`--no-sandbox` required) — fixed via the package's supported `puppeteerOptions`.
2. All VM egress must transit a credentialed proxy that Chrome cannot authenticate to (`ERR_TUNNEL_CONNECTION_FAILED`) — worked around with a small local auth-injecting forward proxy (verified: plain fetches through it return 200).
3. The egress proxy's TLS interception CA is trusted by the system store but not by Chrome-for-Testing's root store (`ERR_CERT_AUTHORITY_INVALID`) — a disclosed, test-only `--ignore-certificate-errors` flag was used. This is an artifact of this VM, not of the package or of AliExpress.

With a working tunnel, the bounded package run then failed: **`Navigation timeout of 90000 ms exceeded`** at the initial `page.goto` (`networkidle2`). A follow-up diagnostic with relaxed settings (`domcontentloaded`, 60 s) never committed a navigation at all — **final URL `about:blank`** after 252 s, and even CDP evaluation timed out (`Runtime.callFunctionOn timed out`). Proxy logs for the package run show only a single CONNECT to `www.aliexpress.com:443` and a handful of ancillary Google hosts — the page's asset/API traffic never materialized.

**Decisive check (client-agnostic):** a plain HTTP fetch of the same product URL from this network returns a 302 chain and nothing else:

```
https://www.aliexpress.com/item/1005007429636284.html
  → 302 https://www.aliexpress.us/item/3256807243321532.html?gatewayAdapt=glo2usa4itemAdapt&_randl_shipto=US
  → 302 https://login.aliexpress.com/sync_cookie_read.htm?xman_goto=<the .us item URL>
  → 302 … (0 bytes final)
```

AliExpress geo-redirects this egress IP to the US storefront (remapping the product ID), then into its login/cookie-sync machinery, and never serves the product page. That is datacenter-IP anti-bot treatment — exactly the stop condition Jaydr-Scraper's security policy defines. Escalating past it (challenge solving, cookie/session manipulation) would be the evasion work that policy excludes, so the test stopped there.

## 3.4 Verdict

- **Unproven, not disproven.** The package is real, current (v4.0.0), small, and cleanly built; its own repo documents live smoke tests. From this VM's network, no scraper — package or hand-rolled — receives a product page to work on, so no extraction verdict is possible here. A meaningful trial would have to run from a residential connection (e.g. Cruze's own machine once repaired).
- **Priority unchanged.** Even a working scraper stays last-resort behind the official Open Platform API, which already returns this data (title, prices, discount, images, ratings, order counts) through a verified, supported path.
- The full test harness is preserved outside this repo at the agent workspace (`~/workspace/scratch/ali-scraper-test/`: `test.mjs`, `run.mjs`, `mini.mjs`, `diag.mjs`, `local-proxy.mjs`, `proxy.log`, `headers.txt`).

---

# Appendix — Error Register Index

All findings and test errors were appended to `.logs/errors.md` in the same commit as this report, continuing the register's numbering:

| ID | Subject |
|---|---|
| ERR-021 | AliExpress connector entirely missing (no adapter/signing/OAuth/API calls) |
| ERR-022 | eBay client built on the broken REST OAuth path; no Trading API |
| ERR-023 | eBay authorize → submit disconnected — stored tokens never reach the client |
| ERR-024 | eBay client wrong endpoints/response shapes (authorize URL, publish_offer) |
| ERR-025 | eBay offer payload placeholders (`'default'` policy IDs, unpersisted timestamp SKUs) |
| ERR-026 | eBay polling service is a stub (`itemsProcessed` hardcoded 0) |
| ERR-027 | eBay webhook verification implements a scheme eBay doesn't use |
| ERR-028 | eBay config gap — required env vars missing from `.env.example`; callback hardcoded to sandbox |
| ERR-029 | Marketplace credentials stored plaintext despite "encrypted" schema comment; rotate script mints an un-mintable Cert ID |
| ERR-030 | No Swanum/SoldStack comps ingestion; repricing competitor input never supplied |
| ERR-031 | Worker has no scheduler; `scheduled_refreshes` table never read; no `listing.submit` processor registered |
| ERR-032 | Test env — Chrome launch as root without `--no-sandbox` |
| ERR-033 | Test env — `ERR_TUNNEL_CONNECTION_FAILED` (credentialed egress proxy vs Chrome) |
| ERR-034 | Test env — `ERR_PROXY_CONNECTION_FAILED`; local proxy crash `ERR_INVALID_ARG_VALUE` on ancillary HTTP |
| ERR-035 | Test env — `ERR_CERT_AUTHORITY_INVALID` (proxy TLS interception vs Chrome root store) |
| ERR-036 | Scraper test — AliExpress anti-bot redirect loop; navigation timeouts; stop condition reached |
| ERR-037 | Scan tooling — GitHub code search `incomplete_results` for this repo (audit caveat) |

*Report compiled 2026-10-22. Scan and test were read-only against the repo; the only repo changes are this document and the `.logs/errors.md` entries above.*
