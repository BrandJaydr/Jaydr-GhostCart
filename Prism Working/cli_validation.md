# CLI & Remote Access Dashboard — Idea Validation

## The Idea
An alternative dashboard accessible via CLI and remote/API access that gives users
access to their basic GhostCart account features and is designed to be **agentic-friendly**
(i.e., consumable by AI agents, automation pipelines, and CI/CD tools).

---

## Verdict: ✅ Strongly Valid — and Strategically Well-Timed

This is not just a nice-to-have. Given where the project currently sits, this idea is
**filling a real gap** and is uniquely well-positioned to deliver value *right now*.

---

## Why This Makes Sense Right Now

### 1. The Backend Is Already Ready

GhostCart already has a rich, production-hardened REST API layer covering:
- **Products** — import, review, corrections, refresh, review-status
- **Listings** — drafts, state transitions, margin calculation, AI rewrite
- **Jobs** — activity, retry, kill-switch
- **Repricing** — suggest, apply, pause
- **Dashboard metrics** — import success, listing states, job failures
- **Alerts** — list, acknowledge
- **eBay** — submit, CSV export
- **Auth** — NextAuth sessions, tenant isolation (RLS)
- **Admin** — beta users, feature flags

A CLI is essentially a thin, structured client over APIs that already exist.
**You're not building infrastructure — you're building an interface.**

### 2. The Frontend Delay Creates a Real User Void

Stages 1–4 are code-complete but the Prism frontend isn't ready for users.
A CLI bridges this gap: real merchants or internal testers can interact
with a working system *today* without waiting for the UI.

### 3. "Agentic Friendly" Is a Strategic Differentiator

The timing is excellent. An agent-consumable GhostCart would allow:
- **AI agents** (like coding assistants, automation agents) to manage a merchant's
  listings, check job status, or trigger imports on their behalf
- **n8n / Zapier / Make workflows** to hook into GhostCart programmatically
- **CI/CD pipelines** to validate live listing state in staging
- **Other AI tools** (Cursor, Cline, Claude Code, etc.) to act as a GhostCart operator
  on behalf of the user

This aligns directly with the Stage 5 goal:
> "Introduce event publication and additional workers when tested workload requires them"

A well-designed agentic CLI pre-positions GhostCart for that expansion.

---

## What This Would Look Like

### Layer 1 — Machine-Readable API Contract (foundation)
- Ensure all existing API routes return consistent, structured JSON
- Add an **API key / token auth path** alongside NextAuth (agents can't do OAuth flows)
- Document a stable **OpenAPI / JSON schema** so agents can introspect capabilities

### Layer 2 — CLI Tool (`ghostcart` binary)
- Built as a Node.js CLI (using `commander` or `oclif`) that ships as an npm package
- Commands map 1:1 to existing API routes, e.g.:
  ```
  ghostcart products list
  ghostcart products import --file products.csv
  ghostcart listings draft <product-id>
  ghostcart listings submit <draft-id>
  ghostcart jobs status
  ghostcart repricing suggest <listing-id>
  ghostcart alerts list
  ```
- Outputs: human-readable tables by default, `--json` flag for machine output

### Layer 3 — Agentic Access Surface (the differentiator)
- **MCP Server** (Model Context Protocol): Expose GhostCart operations as MCP tools
  so any MCP-compatible AI client (Claude Desktop, Cursor, Windsurf, etc.) can
  call GhostCart directly
- **OpenAPI spec**: Allows GPT Actions, Copilot extensions, n8n nodes, etc. to
  auto-discover capabilities
- **Structured tool definitions** following function-calling conventions

---

## Fit With Existing Architecture

| Concern | Status |
|---|---|
| Auth | API key column can be added to `users` table (migration) |
| Tenant isolation | All existing API routes already use `withTenant()` / RLS — CLI calls the same routes |
| Rate limiting | Already implemented per-tenant — CLI traffic covered automatically |
| Audit trail | All API routes already write to `audit_events` — CLI actions are logged for free |
| Job queue | CLI can enqueue jobs the same way the web UI does |
| Security gate (Stage 5) | CLI implementation is a forcing function to replace `DEV_TENANT_ID` fallbacks |

---

## Risks and Guardrails

| Risk | Mitigation |
|---|---|
| API keys are a new auth surface | Short-lived tokens, scoped permissions, revocation endpoint |
| Agents could trigger destructive operations | Read-only mode by default; write operations require explicit `--confirm` flag |
| CLI diverges from API contract | CLI generated from the same OpenAPI spec — spec is the single source of truth |
| Scope creep | CLI is a *client*, not new backend logic. No new domain code |

---

## Where This Fits in the Roadmap

This sits cleanly between Stage 4 (complete) and Stage 5 (open), specifically:
- ✅ Satisfies Stage 5 prerequisite: **API auth/RBAC guard** (replacing DEV_TENANT_ID)
- ✅ Accelerates Stage 5 goal: **event publication** (agents subscribe to webhooks/alerts)
- ✅ Prereqs Stage 6 goal: **third-party API access** and **self-hosting**

It does NOT introduce new domain complexity. It's purely an access layer.

---

## Recommended Scope for v1

| Component | Priority | Effort |
|---|---|---|
| API key auth (migration + middleware) | P0 | ~1 day |
| OpenAPI spec for existing routes | P0 | ~1–2 days |
| CLI (`ghostcart` npm package) | P1 | ~3–4 days |
| MCP server | P1 | ~1–2 days |
| Docs site / quickstart | P2 | ~1 day |

**Total estimated effort: ~1 week for a functional v1**

---

## Open Questions for You

1. **Who is the primary CLI user?** Internal team/you, or external merchant-users too?
2. **What's the remote access model?** Self-hosted (point CLI at your Docker stack) or
   hosted GhostCart-as-a-service with shared infrastructure?
3. **MCP priority:** Is the MCP server the main goal, or is the human-usable CLI the
   primary deliverable?
4. **Security posture:** Do you want API keys to be first-class (full RBAC scopes), or
   a simpler "admin token" to start?
