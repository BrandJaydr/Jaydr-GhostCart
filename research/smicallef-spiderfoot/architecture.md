# Architecture Analysis: SpiderFoot

SpiderFoot's architecture is its strongest asset. Instead of a monolithic script that dictates a top-down flow of operations, it relies on a flexible, event-driven orchestration model.

## The Core Components

1.  **The Orchestrator (`sfscan.py`)**:
    *   Manages the lifecycle of a scan.
    *   Initializes the database and loads requested modules.
    *   Acts as the central message bus.

2.  **The Publisher/Subscriber Model**:
    *   Modules do not call each other directly. Instead, they "publish" events (e.g., `EMAIL_ADDRESS_FOUND`, `IP_ADDRESS_FOUND`).
    *   Other modules "subscribe" to specific event types. When the orchestrator sees an event, it routes it to any module that has declared an interest in that data type.
    *   *Why this matters:* It creates a loosely coupled system. You can add a new module that extracts phone numbers, and any existing module that knows how to look up phone numbers will automatically start processing them without any code changes in the existing modules.

3.  **The Modules (`modules/sfp_*.py`)**:
    *   Each module inherits from a base class (`SpiderFootPlugin`) which provides standardized methods for logging, error handling, checking configuration, and publishing events.
    *   Modules declare what they consume (`watchedEvents`) and what they produce (`producedEvents`).

4.  **Storage (`sf.py`, `sflib.py`)**:
    *   Uses SQLite for persistent storage of scan results.
    *   This allows scans to be paused, resumed, and queried later via the WebUI or CLI.

5.  **Correlation Engine (`correlations/`)**:
    *   A YAML-configurable engine that runs against the SQLite database post-scan (or during) to find complex relationships (e.g., "This IP is on a blacklist AND is associated with this domain").

## Evaluation Against Our Goals

*   **Pros**: Highly extensible, robust failure handling (if one API module crashes, the scan continues), excellent separation of concerns.
*   **Cons**: The event bus can become a bottleneck if not managed carefully (e.g., infinite loops if Module A finds a domain, Module B resolves it to an IP, and Module C resolves the IP back to the same domain). SpiderFoot handles this by tracking "seen" events to prevent loops.
