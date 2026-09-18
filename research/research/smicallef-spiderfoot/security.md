# smicallef/spiderfoot - Security & Anti-Abuse Considerations

## 1. Target Scoping & Guardrails

SpiderFoot implements defensive controls to avoid unintended network operations:

- **Target Inclusion/Exclusion Lists:** Scans can be constrained to strict domain/IP regex boundaries to avoid crawling third-party domains accidentally.
- **Recursion Depth Controls:** Limits how many levels of events can trigger subsequent events, preventing infinite loops or explosive fan-outs.

## 2. Credential & Secret Management

- **Encrypted Storage:** API keys for external services can be stored encrypted or passed via environment variables.
- **Scoped Execution:** Modules without valid credentials automatically self-disable rather than polluting logs with authentication failure errors.

## 3. Anonymity & Network Routing

- **Proxy / SOCKS / Tor Routing:** Supports routing outbound scan traffic through HTTP/SOCKS5 proxies or the Tor network for sensitive intelligence gathering.
- **Custom User-Agent Headers:** Allows setting custom identity strings or honest scan identifier headers.

## 4. Limitations & Vulnerabilities to Avoid

- **Single Process / SQLite Lock Contention:** The original SQLite backend can suffer from database locks under high concurrent thread counts.
- **Thread Overhead:** Python thread-based concurrency is heavier than Node.js async event loops or distributed Redis queues (like BullMQ).
