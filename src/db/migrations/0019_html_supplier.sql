-- ─────────────────────────────────────────────────────────────────────────────
-- Jaydr GhostCart — Migration 0019: Seed the universal HTML Supplier
-- Stage 2 — Enable URL-based product import for HTML product pages
-- ─────────────────────────────────────────────────────────────────────────────
-- The `html` adapter (src/lib/adapters/html.adapter.ts) fetches any public
-- product-page URL and extracts structured data via JSON-LD → OpenGraph →
-- meta-tag fallbacks. It needs a matching `suppliers` row so the import UI
-- can resolve a supplier UUID whose adapter_id = 'html'.
--
-- The dev tenant row is '00000000-0000-0000-0000-000000000001' (migration
-- 0003 dev seed). Idempotent — safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO suppliers (tenant_id, adapter_id, name, config)
SELECT id, 'html', 'Product Page (HTML)', '{"mode":"scrape"}'
FROM tenants
WHERE id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (tenant_id, adapter_id) DO NOTHING;