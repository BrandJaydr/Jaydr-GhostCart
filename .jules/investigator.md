# Investigator Journal - Jaydr GhostCart

Register of recurring error patterns, systemic reliability issues, and hidden integration failures found by the Investigator (observability) agent.

## 2026-08-17 - Observability Audit (buttons / undeveloped frontend / hidden security)

### Hidden integration failure
- ImportForm <-> POST /api/products contract drift: request body keys (sourceUrl/adapter) and response id (data.id vs data.jobId) both diverge from the enqueue contract. No UI/debug surface surfaces the cause. See .logs/errors.md ERR-022.

### Systemic reliability - undeveloped frontend over built APIs
- 7 nav routes (jobs, repricing, settings x3, profile, sign-out) return 404 while their APIs ship. See ERR-023.

### Hidden security / session risk
- No signOut() wired anywhere; logout routes to a missing page; stale sessions. See ERR-024.
- Logging boundary unenforced (40 files raw console.*) and webhook logs full order payload, contradicting SEC-005 RESOLVED. Reopened as SEC-007.
- Plaintext Google + Magic API keys at rest in local Cline MCP config. See SEC-008.

## Review cadence
- Re-scan after frontend feature pages are built and after the structured-logging migration completes.