# AliExpress `aliexpress.ds.text.search` Fixture Pack

## Overview
This directory contains recorded-shape responses for the official AliExpress Open Platform API call `aliexpress.ds.text.search`.

These fixtures serve as test data for the `aliexpress` supplier adapter, search client, and normalization layer (`GC-201`, `GC-202`, `GC-203`, `GC-204`).

## Provenance
- **Source:** Verified live-response structure from AliExpress Open Platform (Drop Shipping / DS Text Search method `aliexpress.ds.text.search`), as audited and documented in `Docs/connector-scan-report-2026-10-22.md` and `Docs/development-plan.md` Phase 1.
- **Created Date:** 2026-10-25
- **Task:** `GC-T1` (LANE-3 / Minion 1)

## Files Included

1. `full.json`: Success response containing populated search result records (`selection_search_product`), including IDs, titles, prices, currency, images, evaluation rates, sales volume, category IDs/names, and shipping estimates.
2. `empty.json`: Success response (`rsp_code: 200`) with 0 matching results (`total_record_count: 0`, `selection_search_product: []`).
3. `error.json`: Standard Open Platform error envelope (`error_response`) detailing error code, sub-code (`isv.invalid-parameter:session-expired`), message, and request ID.
4. `index.ts`: Typed TypeScript exports providing full autocomplete and type safety for Vitest unit and integration tests.

## Verified Field Reference
- `product_id`: Unique numeric identifier for the AliExpress product.
- `product_title`: Full product title string.
- `product_main_image_url`: Primary product image URL.
- `product_small_image_urls`: Object holding array of secondary image URLs (`string.[]`).
- `target_sale_price` / `target_sale_price_currency`: Current sale price and currency code.
- `target_original_price` / `target_original_price_currency`: Original/list price and currency code.
- `evaluate_rate`: Customer feedback rating percentage (e.g., `"96.5%"`).
- `volume`: Total units sold / order volume.
- `first_level_category_id` / `first_level_category_name`: Primary category classification.
- `second_level_category_id` / `second_level_category_name`: Secondary category classification.
- `ship_to_days`: Estimated shipping transit duration (e.g. `"7-12"`).

## Usage in Tests

```typescript
import {
  aliexpressFullSearchFixture,
  aliexpressEmptySearchFixture,
  aliexpressErrorSearchFixture
} from '@/__tests__/fixtures/aliexpress';

describe('AliExpress Search Client', () => {
  it('parses full response into canonical products', () => {
    // ... test logic using aliexpressFullSearchFixture
  });
});
```
