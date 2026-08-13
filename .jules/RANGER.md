# RANGER Journal

## 2026-08-12 — API authorization boundary

Critical security learning: dashboard layout protection does not protect API routes. Many handlers still use `DEV_TENANT_ID`, and `/api/admin/beta-users` accepts caller-supplied tenant/user identifiers without an explicit session or role check. Track as ERR-016. Authentication changes were not applied during this review; the production gate is a shared server-side auth/RBAC guard plus cross-tenant tests.
