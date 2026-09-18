# smicallef/spiderfoot - Scraping & Ingestion Techniques

## 1. Multi-Modal Ingestion Techniques

SpiderFoot collects data from hundreds of endpoints using three distinct tiers of data gathering:

### 1.1 Direct HTTP Scraping & Extraction
- **Regex & Structured Parser Pipeline:** Modules extract targeted entities (hashes, links, email addresses, phone numbers) from raw HTML/text.
- **Header & Meta Inspection:** Extraction of server banners, SSL certificates, DNS TXT/MX records, and OpenGraph/JSON metadata.

### 1.2 REST & GraphQL API Integration
- Over 150+ modules connect to third-party web APIs (Shodan, Hunter.io, Censys, VirusTotal, BuiltWith, etc.).
- **Graceful Degradation:** Modules check for API key presence at startup; if unconfigured, they cleanly disable themselves without throwing exceptions or blocking other modules.

### 1.3 Passive vs. Active Probing Modes
- **Passive Mode:** Queries only third-party caches, search engines, and aggregate indices (never touches the target directly).
- **Active Mode:** Directly connects to target ports, scrapes web pages, and queries live DNS servers.

## 2. Request Management & Throttling Patterns

### 2.1 Per-Host Rate Limiter (Token Bucket / Delay Queue)
SpiderFoot tracks timestamps per target domain/host. If module $A$ and module $B$ both need data from `api.example.com`, the engine enforces a mandatory quiet window between requests to avoid triggering HTTP 429 (Too Many Requests).

### 2.2 Response Caching Strategy
- HTTP responses are hashed by URL + query parameters and cached in the local database.
- If module 1 requests `https://supplier.com/item/123` to parse pricing, and module 2 later requests `https://supplier.com/item/123` to parse images, module 2 instantly receives the cached body with 0 network latency and 0 extra HTTP requests.

### 2.3 Memory & Payload Protection
- `max_content_length`: Checks `Content-Length` headers before streaming response bodies.
- Streams responses in chunks; if a supplier page or asset exceeds a threshold (e.g., 5MB for HTML), the download is truncated to protect memory and event worker stability.
