# Lessons for Jaydr Scraper

The analysis of SpiderFoot yields several critical lessons that we should integrate into our technical foundation.

## 1. The Power of Pub/Sub Orchestration
**Lesson:** Do not hardcode the scraping pipeline (e.g., `fetch() -> parse_item_a() -> parse_item_b()`). Instead, use an event bus.
*   **Application:** Our orchestrator should dispatch "ResourceFetched" events. Independent parsers can subscribe to this event, extract what they need, and emit "RecordParsed" events. This makes adding new parsers or supporting new schemas trivial and prevents monolithic, fragile code.

## 2. Graceful Degradation is Mandatory
**Lesson:** Individual failures should not crash the pipeline.
*   **Application:** If we are parsing a complex page and the price parser fails due to a layout change, but the title and description parsers succeed, we should still salvage the partial data. Modules/parsers must catch their own exceptions and report structured errors back to the orchestrator.

## 3. Centralized HTTP Primitives
**Lesson:** Modules shouldn't handle their own raw HTTP connections.
*   **Application:** Like SpiderFoot's `sflib.py`, we need a core `Fetcher` primitive (as outlined in our Phase 2 plan) that enforces timeouts, retries, proxy rules, and User-Agent policies globally. No module should be allowed to use `requests.get()` or `axios.get()` directly.

## 4. SQLite as a Robust Sink
**Lesson:** File-based storage is good, but SQLite is better for structured, resumable jobs.
*   **Application:** For our Phase 2 `Sink` and `Frontier`, using SQLite (or a similar lightweight embedded database) instead of flat JSON files will allow us to pause/resume crawls, handle uniqueness constraints (the "seen-set"), and prevent data loss during crashes much more effectively.

## 5. Evasion is Not Necessary for Success
**Lesson:** A tool can be incredibly effective relying purely on permitted APIs, HTTP parsing, and transparent behavior.
*   **Application:** Reinforces our stance that we do not need to build anti-bot evasion systems. We can build a valuable pipeline by respecting origin rules and focusing on robust orchestration and parsing of accessible data.
