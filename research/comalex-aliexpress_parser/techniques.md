# comalex/aliexpress_parser - Scraping Techniques

## HTTP Client Strategy

**Primary HTTP Library:** requests

**Configuration:**
- No explicit timeout settings visible
- No retry logic implemented
- Default redirect handling (requests follows redirects)
- Compression support via Accept-Encoding header
- Connection pooling via requests.Session

**Request Patterns:**
- Both GET and POST methods used
- Static headers set once during session initialization
- Basic cookie handling through session (automatic)
- No explicit session management beyond requests.Session

## Parsing Strategy

**Primary Parser:** BeautifulSoup with lxml backend

**Parsing Approach:**
- CSS selectors primarily used (find, find_all with class/id)
- No XPath usage
- DOM traversal through BeautifulSoup methods
- Error handling with try-catch around individual element extraction
- Text extraction with .text property

**Code Example:**
```python
def get_data(self, tag, attrs, val_type="str"):
    text = ""
    try:
        text = self.main_page_soap.find(tag, attrs).text
        if val_type != "str":
            m = re.search(r"[-+]?\d*\.\d+|\d+", text)
            if m:
                text = m.group()
    except Exception as e:
        logger.debug("PASS: tag: %s, attrs: %s", tag, attrs)
    return text
```

## Browser Automation

**Library Used:** None (HTTP-only approach)

**When Used:**
- Not used - pure HTTP approach throughout
- No detection logic for browser necessity
- No fallback to browser automation

**Performance Considerations:**
- No browser pool management needed
- No resource cleanup for browser processes
- Lower memory footprint compared to browser automation
- Faster execution for static content

## API Usage

**Official APIs:**
- No official AliExpress API usage
- Uses public web endpoints only

**Unofficial APIs:**
- Uses discovered JSON endpoints embedded in pages:
  - Product description URLs extracted from JavaScript
  - Feedback/review AJAX endpoints
  - Transaction history AJAX endpoints
- No authentication required for these endpoints
- Parameters discovered through page inspection

## Dynamic Content Handling

**JavaScript Rendering:**
- No JavaScript execution
- Extracts JSON data embedded in page source
- Uses regex to find JSON data in JavaScript variables
- No wait strategies or element detection

**AJAX/Fetch:**
- Makes direct HTTP requests to AJAX endpoints discovered in pages
- No network interception
- Manually constructs POST requests for feedback pagination
- Handles JSON responses from AJAX endpoints

**Code Example:**
```python
# Extract JSON data from embedded JavaScript
var = soap_page(text=re.compile(r'data_widgety5zzyn'))
json_data = json.loads(var[0][var[0].index('{'):])
products_url = json_data["source"]["url"]
```

## Data Extraction Patterns

**Selector Strategy:**
- CSS selectors with class and id attributes
- Regular expressions for data extraction from text
- Attribute extraction (href, src, thesrc)
- Text content extraction

**Data Structures:**
- Dictionary-based data structures
- Lists for collections (comments, transactions, images)
- String manipulation for numeric data extraction
- JSON serialization for complex data (descriptions)

## Session & State Management

**Cookie Management:**
- Automatic cookie handling through requests.Session
- No explicit cookie manipulation
- Session persistence across requests

**State Between Requests:**
- Session object maintains cookies and headers
- No explicit state management for pagination
- URL parameters used for pagination state

## Rate Limiting & Throttling

**Rate Limit Strategy:**
- Simple sleep() calls between requests
- Random delay between 0.5-3 seconds
- No sophisticated rate limiting
- No concurrent request limits
- No exponential backoff

**Code Example:**
```python
def sleep(self, t=None):
    #dummy function for sleep beetween  requests to not be blocked
    time.sleep(t or random.uniform(0.5, 3))
```

## Special Techniques

**Notable Techniques:**

1. **Method Naming Convention:** Uses parse_* prefix for automatic method execution
```python
methods = [getattr(self, m) for m in dir(self) if m.startswith("parse_")]
for method in methods:
    try:
        method()
    except Exception as e:
        logger.exception(e)
```

2. **JSON Data Extraction:** Extracts JSON embedded in JavaScript using regex
3. **Image URL Processing:** Transforms thumbnail URLs to original image URLs
4. **URL Fixing:** Handles relative URLs by prepending "https:"
5. **Debug Proxy Support:** Charles/Fiddler integration for debugging

## Technique Strengths

- **HTTP-first approach:** Efficient for static content
- **Session management:** Proper connection pooling
- **Embedded JSON extraction:** Clever way to access dynamic data without browser
- **Modular parsing:** Easy to add new extraction methods
- **Debug support:** Proxy integration for development

## Technique Weaknesses

- **No retry logic:** Failed requests are not retried
- **Basic rate limiting:** Simple sleep without adaptive backoff
- **Fragile selectors:** CSS selectors may break with site changes
- **No JavaScript execution:** Limited for heavily JS-dependent sites
- **Regex parsing:** Fragile JSON extraction with regex
- **No error recovery:** Continues past failures without retry

## Applicability to Our Project

**Techniques to consider:**
- HTTP-first approach aligns with our principles
- Session management through requests.Session is good practice
- Method naming convention for parsing methods is clever and maintainable
- Embedded JSON extraction could be useful for some sites
- Debug proxy support is valuable for development

**Techniques to avoid:**
- Regex-based JSON extraction (use proper JSON parsers)
- Basic sleep without adaptive rate limiting
- Fragile CSS selectors without fallback strategies
- Lack of retry logic for failed requests