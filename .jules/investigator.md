# Investigator Journal

## 2026-08-12 — Uncorrelated failure handling

Recurring pattern confirmed across API routes, worker handlers, and libraries: errors are emitted through raw `console.*` calls without a shared request/job correlation field or consistent retry classification. The eBay webhook handler also logs a complete payload. Track as ERR-017 and prioritize a shared structured logger with redaction and correlation propagation.
