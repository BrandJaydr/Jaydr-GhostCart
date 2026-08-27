# Triple Pass Protocol  Enable URL-based Product Import via Web Scraping

## Pass 1: Understanding
- Problem: User pastes product URL, clicks "Import Product", but no product appears in table
- Root causes: (a) worker not running, (b) no adapter for HTML product pages, (c) no auto-detect supplier
- AliExpress API requires credentials  none configured; will build generic HTML adapter instead

## Pass 2: Verification
- html.adapter.ts uses stdlib fetch + regex (no new deps)
- All DB queries parameterized (no SQL injection)
- Worker in docker-compose depends on db + redis healthchecks

## Pass 3: Completeness
- Edge cases: HTTP errors, non-HTML, price formats, currency, images, availability
- Implementation: Cycle 1 (5 files), Cycle 2 (5 files)