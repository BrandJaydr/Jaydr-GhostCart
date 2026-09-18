# smicallef/spiderfoot - Technical Architecture Analysis

## 1. System Topology & Event Flow

SpiderFoot uses an asynchronous, event-driven publisher/subscriber architecture to coordinate 200+ intelligence-gathering plugins without tight coupling between them.

```
                    ┌────────────────────────┐
                    │      Root Target       │
                    │  (e.g., Domain / SKU)  │
                    └───────────┬────────────┘
                                │ Initial Event
                                ▼
                    ┌────────────────────────┐
                    │     SpiderFoot Core    │
                    │      Event Queue       │
                    └───────────┬────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│ Module A      │       │ Module B      │       │ Module C      │
│ (Watches:     │       │ (Watches:     │       │ (Watches:     │
│  DOMAIN)      │       │  DOMAIN)      │       │  RAW_HTML)    │
└───────┬───────┘       └───────┬───────┘       └───────┬───────┘
        │ Emits                 │ Emits                 │ Emits
        │ SUBDOMAIN             │ RAW_HTML              │ TECH_STACK
        └───────────────────────┼───────────────────────┘
                                │ Cascading Events
                                ▼
                    ┌────────────────────────┐
                    │     SpiderFoot Core    │
                    │   Dispatches to Next   │
                    │   Registered Modules   │
                    └────────────────────────┘
```

## 2. Key Architectural Components

### 2.1 The Event Dispatcher & Bus
- **Event Definition:** `SpiderFootEvent(eventType, eventData, module, sourceEvent)`
- **Lineage:** Every event contains `sourceEventHash`, creating an immutable Directed Acyclic Graph (DAG) of data derivation.
- **Dynamic Dispatch:** When a module completes execution and calls `self.notifyListeners(event)`, the engine looks up all modules that declared `watchedEvents().contains(event.type)` and schedules them for execution.

### 2.2 Standard Plugin Contract (`SpiderFootPlugin`)
Every module subclasses `SpiderFootPlugin` and implements:
- `watchedEvents()`: Returns an array of event types the plugin consumes.
- `producedEvents()`: Returns an array of event types the plugin produces.
- `handleEvent(event)`: The main execution handler. Receives typed data and emits new events.
- `opts()` / `optdesc()`: Declares configuration schema, API key requirements, timeouts, and boolean flags.

### 2.3 Storage Layer
- SQLite / PostgreSQL backend storing:
  - `tbl_scan_instance`: Scan metadata, status, target, and configuration snapshot.
  - `tbl_scan_results`: Normalized event records with source event hashes, module names, timestamps, and confidence ratings.
  - `tbl_scan_config`: Global and per-scan option overrides.

### 2.4 Centralized Fetch & Caching Subsystem (`SpiderFootDb / SpiderFootHelpers`)
- Shared HTTP client handling:
  - Automatic connection reuse and timeout management.
  - Per-domain rate limiting (`_throttle` interval per host).
  - SHA-256 caching of HTTP responses to prevent duplicate requests across multiple modules querying the same URL.
  - Max content size enforcement (`max_content_length`) to protect workers from downloading runaway multi-gigabyte files.
