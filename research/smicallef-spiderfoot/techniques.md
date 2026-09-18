# Techniques Analysis: SpiderFoot

SpiderFoot utilizes a variety of techniques to gather intelligence, serving as a good reference for different ways to extract structured data.

## 1. Direct API Integrations

The vast majority of SpiderFoot's 200+ modules are simple wrappers around external REST APIs (e.g., Shodan, VirusTotal, HaveIBeenPwned).
*   **Technique**: Modules standardise API requests using a shared HTTP library wrapper (inside `sflib.py`) which handles timeouts, retries, and User-Agent cycling (though normally it uses a standard SpiderFoot UA).
*   **Value for us**: Provides a blueprint for writing clean, consistent API consumers that gracefully handle rate limits (429 Too Many Requests) and missing keys.

## 2. Targeted Web Spidering (`sfp_spider.py`)

SpiderFoot includes a custom web spider for crawling targets directly.
*   **Technique**: It uses standard Python `urllib`/`requests`-style HTTP fetching coupled with BeautifulSoup for parsing HTML. It does *not* use headless browsers like Puppeteer or Playwright.
*   **Value for us**: It demonstrates how to effectively crawl a site and extract specific entities (links, emails, metadata) purely through HTTP, adhering to our principle of "Prefer HTTP + parse over browsers."

## 3. External Tool Wrapping

SpiderFoot can shell out to invoke external command-line tools (e.g., `nmap`, `whatweb`, `dnstwist`).
*   **Technique**: It uses Python's `subprocess` module to run the tool, captures `stdout`/`stderr`, and then parses the raw text output or XML output into SpiderFoot events.
*   **Value for us**: While we aim to build our own parsers, this shows a viable fallback strategy: if an excellent tool already exists for a specific niche, orchestrating it rather than rewriting it is a valid architectural choice.

## 4. Regular Expression Extraction

Because SpiderFoot ingests unstructured data from many sources, it relies heavily on RegEx.
*   **Technique**: Standardized regex patterns are used globally to identify IPs, emails, bitcoin addresses, etc., out of raw text blocks.
*   **Value for us**: A reminder that parsing doesn't always mean traversing a DOM tree or reading JSON; sometimes robust, well-tested regexes applied to raw payloads are the most efficient extraction method.
