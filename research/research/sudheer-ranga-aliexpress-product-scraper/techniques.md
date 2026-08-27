# sudheer-ranga/aliexpress-product-scraper - Scraping Techniques

## HTTP Client Strategy

**Primary HTTP Library:** node-fetch

**Configuration:**
- No explicit timeout settings visible for HTTP requests
- Basic error handling for HTTP status codes
- Default redirect handling
- No compression configuration visible
- No connection pooling

**Request Patterns:**
- Primarily GET requests for review fetching
- No complex POST operations
- Standard headers through node-fetch defaults
- Cookie handling not explicitly managed

## Parsing Strategy

**Primary Parser:** Cheerio

**Parsing Approach:**
- CSS selectors for HTML parsing (description pages)
- Direct JSON parsing for API responses
- JSONP parsing for wrapped API responses
- Data transformation through pure functions
- Schema validation through type checking

**Code Example:**
```javascript
const parseJsonp = (jsonpStr) => {
  const trimmed = jsonpStr.trim();
  const match = trimmed.match(/^[a-zA-Z0-9_]+\(([\s\S]+)\)$/);
  if (match && match[1]) {
    return JSON.parse(match[1]);
  }
  return JSON.parse(trimmed);
};
```

## Browser Automation

**Library Used:** Puppeteer with puppeteer-extra-plugin-stealth

**When Used:**
- Primary approach for all scraping operations
- Required for Client-Side Rendered (CSR) pages
- No fallback to HTTP-only approach
- Browser automation used for all data extraction

**Browser Configuration:**
- Headless mode by default
- Stealth plugin to avoid bot detection
- Configurable Puppeteer options
- networkidle2 wait strategy for CSR pages
- Response interception for API data

**Performance Considerations:**
- Browser cleanup guaranteed in error handlers
- Configurable timeout for page navigation
- API response interception to reduce wait times
- Resource-intensive but necessary for CSR pages

**Code Example:**
```javascript
puppeteer.use(StealthPlugin());
browser = await puppeteer.launch({
  headless: true,
  ...(puppeteerOptions || {}),
});
```

## API Usage

**Official APIs:**
- No official AliExpress API usage
- Uses discovered/unofficial API endpoints

**Unofficial APIs:**
- **mtop.aliexpress API:** Intercepts product data API responses
- **feedback.aliexpress API:** Uses for review fetching
- **Description API:** Fetches product description from separate endpoint
- No authentication required for discovered endpoints
- JSONP/JSON format responses

**API Interception:**
```javascript
page.on('response', async (response) => {
  const url = response.url();
  if (url.includes('mtop.aliexpress') && url.includes('pdp')) {
    try {
      const text = await response.text();
      if (text && text.length > 1000) {
        const parsed = parseJsonp(text);
        if (parsed?.data?.result) {
          apiData = parsed;
        }
      }
    } catch {
      // Ignore parsing errors
    }
  }
});
```

## Dynamic Content Handling

**JavaScript Rendering:**
- Full JavaScript execution through Puppeteer
- API response interception for CSR data
- Fallback to window.runParams for backwards compatibility
- Wait strategies for data availability

**AJAX/Fetch:**
- Network interception for API responses
- Direct HTTP requests for known API endpoints
- Response size validation to filter relevant responses
- Async data fetching with polling

**Wait Strategy:**
```javascript
let data = null;
const maxWaitTime = 15000; // 15 seconds max
const startTime = Date.now();

while (!data && (Date.now() - startTime) < maxWaitTime) {
  if (apiData) {
    data = extractDataFromApiResponse(apiData);
    if (data) break;
  }
  
  const runParamsData = await page.evaluate(() => {
    try {
      return window.runParams?.data || null;
    } catch {
      return null;
    }
  });
  
  if (runParamsData && Object.keys(runParamsData).length > 0) {
    data = runParamsData;
    break;
  }
  
  await new Promise((resolve) => setTimeout(resolve, 500));
}
```

## Data Extraction Patterns

**Selector Strategy:**
- Minimal CSS selector usage (mainly for description pages)
- Primary reliance on API data extraction
- JSON path extraction for nested data
- Data transformation through pure functions

**Data Structures:**
- Comprehensive JSON response structure
- Nested objects for related data (variants, reviews, shipping)
- Array structures for collections
- Currency and price objects with formatting

## Session & State Management

**Cookie Management:**
- Automatic cookie handling through Puppeteer
- No explicit cookie manipulation
- Session maintained through browser instance

**State Between Requests:**
- Browser instance maintains state
- API interception maintains request context
- No explicit state management for pagination

## Rate Limiting & Throttling

**Rate Limit Strategy:**
- No explicit rate limiting implemented
- Relies on browser automation natural delays
- Configurable review pagination limits
- No exponential backoff
- No concurrent request limits

**Pagination Handling:**
```javascript
let totalPages = Math.ceil(count / COUNT_PER_PAGE);
if (totalPages >= 5) {
  totalPages = 5; // Max 5 pages of reviews
}

for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
  const reviewUrl = `https://feedback.aliexpress.com/pc/searchEvaluation.do?productId=${productId}&page=${currentPage}&pageSize=${COUNT_PER_PAGE}&filter=${filterReviewsBy}`;
  // ... fetch and process
}
```

## Special Techniques

**Notable Techniques:**

1. **API Response Interception:** Intercepts network responses to capture API data instead of parsing HTML
2. **Stealth Plugin:** Uses puppeteer-extra-plugin-stealth to avoid bot detection
3. **JSONP Parsing:** Handles wrapped JSON responses from AliExpress APIs
4. **Fallback Strategy:** Multiple data extraction methods (API interception → runParams → error)
5. **Privacy-focused Review Processing:** Uses faker to generate fake display names for reviewer privacy

## Technique Strengths

- **API Interception:** More reliable than HTML parsing for dynamic sites
- **Fallback Strategies:** Multiple extraction methods improve reliability
- **Modern Practices:** Up-to-date with current web scraping challenges
- **Privacy Consideration:** Faker usage for reviewer privacy
- **Comprehensive Data:** Extracts extensive product information

## Technique Weaknesses

- **Browser Dependency:** Heavy resource usage
- **Stealth Approach:** Evasion-oriented rather than compliant
- **No Rate Limiting:** Could trigger anti-bot measures
- **Single-Product Focus:** Not optimized for bulk operations
- **Resource Intensive:** Browser automation overhead

## Applicability to Our Project

**Techniques to consider:**
- API response interception pattern (if we use browser automation)
- Fallback strategy approach for reliability
- Privacy-focused data processing
- Pure function design for data transformation
- Comprehensive error handling

**Techniques to avoid:**
- Stealth plugin usage (evasion-oriented)
- Browser-first approach (conflicts with HTTP-first principle)
- Lack of rate limiting
- Resource-intensive browser automation