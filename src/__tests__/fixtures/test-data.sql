-- ─────────────────────────────────────────────────────────────────────────────
-- Jaydr GhostCart — Test Data Fixtures
-- Used for integration and E2E tests
-- ─────────────────────────────────────────────────────────────────────────────

-- Insert test tenant
INSERT INTO tenants (id, name, slug, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Test Tenant',
  'test-tenant',
  now()
)
ON CONFLICT (id) DO NOTHING;

-- Insert test user
INSERT INTO users (id, tenant_id, email, name, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'test@example.com',
  'Test User',
  now()
)
ON CONFLICT (id) DO NOTHING;

-- Insert test supplier
INSERT INTO suppliers (id, tenant_id, name, type, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Test Supplier',
  'test_adapter',
  now()
)
ON CONFLICT (id) DO NOTHING;

-- Insert test product
INSERT INTO products (
  id,
  tenant_id,
  supplier_id,
  source_url,
  title,
  description,
  primary_image_url,
  additional_image_urls,
  currency,
  supplier_price_cents,
  attributes,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'https://example.com/product/1',
  'Test Product Title',
  'Test product description with details about the item.',
  'https://example.com/image1.jpg',
  ARRAY['https://example.com/image2.jpg', 'https://example.com/image3.jpg'],
  'USD',
  1999,
  '{"brand": "TestBrand", "color": "Red", "size": "M"}'::jsonb,
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- Insert test listing draft
INSERT INTO listings (
  id,
  tenant_id,
  product_id,
  title,
  description,
  list_price_cents,
  currency,
  image_urls,
  attributes,
  state,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Test Listing Title',
  'Test listing description with optimized content.',
  2499,
  'USD',
  ARRAY['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
  '{"condition": "New", "category": "Electronics"}'::jsonb,
  'draft',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;
