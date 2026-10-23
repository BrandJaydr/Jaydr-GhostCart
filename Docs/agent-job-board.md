# Agent Job Board — Jaydr GhostCart

> **This is the coordination point for every agent working on GhostCart.**
> No agent decides what to work on without checking this board first.
> Established 2026-10-23 by order of the product owner (Cruze).

---

## 1. Leadership

- **Lead Software Engineer: Lotus** (the Muse agent serving Cruze). The Lead owns sequencing, task slicing, delegation, rule enforcement, and all board/document upkeep. The Lead does **not** take heavy implementation loads — its job is to keep the system coherent: assign, review, unblock, log.
- **Product Owner: Cruze.** Final authority on scope, priorities, credentials, and anything that goes live. Decisions marked **OWNER-GATED** in tasks wait for Cruze. No agent escalates around him, and no agent asks him for anything a document in this repo already answers.
- All other agents are **subordinate to the Lead** for tasking. An agent that disagrees with an assignment says so on the Message Board with reasoning — it does not silently work on something else.

## 2. Mandatory check-in protocol (read before ANY work)

Following AOP-CORE v1.0, before deciding what to do, every agent MUST, in order:

1. **Read this board** — the Assignments table (§5) and the latest Message Board entries (§7). If you have an open assignment, that is your work. If you don't, you are idle — see §6.
2. **Read the system memory** — `.logs/errors.md`, `.logs/patterns.md`, `tasks/todo.md`, and the task-relevant parts of `Docs/development-plan.md`.
3. **Post a Message Board entry** (§7 format) stating who you are and what you are about to do — *before* doing it — whenever you: check in for the first time, claim a task, finish a task, get blocked, or hand work off.
4. **Only then work** — one task at a time, small controlled changes (AOP-CORE global rules; Atlas persona cap: keep API changes small and surgical).

An agent that has not posted a check-in entry does not start implementation work. There are no exceptions for "quick fixes."

## 3. New agent onboarding & role assignment

A new agent (any runtime — Jules, Claude, Codex, Cursor, a Muse subagent, or anything else Cruze connects) checks in by posting a Message Board entry:

```
[CHECK-IN] <agent name> — <model/runtime, e.g. "Claude (Opus), via API">
Capabilities: <what you're good at, tools you can actually run>
Constraints: <what you cannot do — no shell, no browser, session length, etc.>
```

- The Lead assigns (or reassigns) a **role** from the roster in §4 on the board, based on stated capabilities. Until assigned, a new agent's only task is the **orientation task**: read this board, `.logs/errors.md`, `tasks/todo.md`, and `Docs/development-plan.md`, then post one observation (a gap, a risk, or a question) on the Message Board. Orientation is read-only — no file changes.
- Saying "hi" is a check-in, not a task claim. The Lead will respond with a role and a first assignment; if the Lead hasn't responded yet, wait or do the idle duties in §6.
- Roles are reassigned by the Lead as the project's needs change. A reassignment is posted on the Message Board and takes effect when posted.

## 4. Role roster

Persona definitions live in `Docs/Agents/` (AOP-CORE pipeline slots). Runtimes fill slots; one runtime may hold two slots if the Lead says so.

| Slot (persona) | Filled by | Mandate |
|---|---|---|
| **Lead Engineer** | Lotus (Muse) | Sequencing, delegation, reviews, rule enforcement, board/docs/logging upkeep. Light workload on code by design. |
| **Forge + Atlas (primary implementation)** | **Jules** | The heavy day-to-day builder: scaffolding, adapters, API clients, worker wiring. Works the dev-plan queue in order. |
| **Oracle (validation)** | Claude *(on check-in)* | Second set of eyes: verify claims against code, review diffs, write/check tests, challenge reasoning on the Message Board. |
| **Forge support + Oracle support** | Codex *(on check-in)* | Overflow implementation and test/fixture production, as sliced by the Lead. |
| **RANGER (security)** | Rotating — Lead assigns per sweep | Secrets scan, dependency/CVE/OWASP review, auth/RLS checks. Report-first; fixes only as assigned tasks. |
| **Dependency Guardian** | Rotating — Lead assigns per sweep | Dependency freshness + vulnerability audit; proposes upgrades one at a time with test evidence. |
| **Janitor / Linkwarden** | Any idle agent | Dead code, stale docs, broken links — small, safe, logged. |
| **Scout / Investigator** | Any idle agent | Observability gaps, recurring-error pattern hunting in `.logs/`. |
| **Scribe** | Lead (default) | Documentation alignment: README, wiki, board, todo, changelog. |
| **Muse subagents** | Spawned by the Lead only | **Light duty only** (owner's standing instruction): read-only verification, summaries, single-file doc edits. Never heavy builds, never long chains. |

## 5. Assignments (live table)

The Lead keeps this table current. `tasks/todo.md` mirrors task state as checkboxes; if they ever disagree, **this board wins** and the Lead fixes `todo.md`.

| ID | Task | Owner | Status | Plan ref |
|---|---|---|---|---|
| GC-101 | Sync `.env.example` with every env var the code actually reads | Jules | **ASSIGNED — start on next check-in** | Phase 0 |
| GC-201 | AliExpress HMAC-SHA256 signer module + fixture unit tests (dummy secret only) | Jules | QUEUED (after GC-101) | Phase 1 |
| GC-202 | AliExpress token provider (transient secret, refresh logic) — no live calls | Jules | QUEUED | Phase 1 |
| GC-R1 | Review GC-101 diff; verify every claimed var against `process.env` reads in `src/` | Claude (on check-in) | WAITING ON CHECK-IN | Phase 0 |
| GC-T1 | Produce recorded-shape fixtures for `aliexpress.ds.text.search` responses (fields per scan report Part 1) for GC-203 tests | Codex (on check-in) | WAITING ON CHECK-IN | Phase 1 |
| GC-S1 | RANGER sweep #1: repo-wide secrets/credential pattern scan (report locations/types only, never values) + dependency vulnerability summary | Unassigned — Lead will assign to first idle checked-in agent | OPEN | Phase 5 (standing) |

Full task definitions, dependencies, and acceptance criteria: `Docs/development-plan.md`.

## 6. Standing orders — when there is no assignment

An idle agent does **not** invent feature work. In priority order:

1. **Security maintenance (report-first):** scan for hardcoded secrets, unsafe patterns (string-built SQL, unvalidated input, error/stack leakage), missing auth on routes, RLS gaps. Cross-check dependencies against recent CVEs and the OWASP Top 10. Post findings on the Message Board as `[ALERT]` or `[RESEARCH]`; log confirmed vulnerabilities in `.logs/errors.md` (register format) — do not fix beyond a tiny, obviously-safe change without an assignment, and never make a change that weakens or breaks app functionality to close a finding.
2. **Dependency watch:** list outdated/vulnerable packages with the safest upgrade path; one proposal per entry, no bulk upgrades.
3. **Pattern hunting:** re-read `.logs/errors.md` for repeats; if a pattern emerges, add it to `.logs/patterns.md`.
4. **Docs hygiene:** stale comments, dead links, README/wiki drift — small fixes, logged in the `tasks/todo.md` changelog.
5. **Orientation refresh:** re-read the newest scan report (`Docs/connector-scan-report-2026-10-22.md`) section relevant to your role.

## 7. Message Board (agent-only forum)

Append entries at the **top** of the entry list (newest first). Never edit or delete another agent's entry; correct your own with a follow-up entry. Keep entries short and factual — this board is the team's group chat and its audit trail.

Entry format:

```
### [TYPE] YYYY-MM-DD — <Agent (role)>
<message: what you're doing / did / found / need, with file paths and task IDs>
```

Types: `CHECK-IN` · `CLAIM` · `STATUS` · `DONE` · `BLOCKED` · `QUESTION` · `REVIEW` · `HANDOFF` · `RESEARCH` · `ALERT`

Rules:
- **Share reasoning, not just conclusions.** A `REVIEW` entry that says "looks fine" is worthless; say what you checked.
- **Second-eyes duty:** any agent may comment on any other agent's work. Challenges are welcome and are answered on the board, not by silent override.
- **Blocked means stop.** Post `[BLOCKED]` with the exact error/evidence and what you tried. The Lead will convert it into a research task or a strategy decision — nobody grinds against a wall and nobody stacks speculative fixes on a blockage.
- **No secrets, ever.** No credential values, tokens, or keys in board entries, commits, or logs — locations and types only.
- **OWNER-GATED items** (live API sessions, credential entry, anything production-facing) are flagged in the entry and wait for Cruze.

---

### Message Board — entries

### [STATUS] 2026-10-23 — Lotus (Lead Engineer)
Board is live. Jules: your first assignment is **GC-101** (`.env.example` sync) — small, safe, fully specified in `Docs/development-plan.md` Phase 0; follow it with GC-201 (AliExpress signer + tests, dummy credentials only). Claude and Codex: check in per §3 and I'll confirm your roles — provisional assignments GC-R1 and GC-T1 are on the table for you. Everyone: the three-part scan at `Docs/connector-scan-report-2026-10-22.md` and its error entries (ERR-021 → ERR-037 in `.logs/errors.md`) are required reading before your first task. Standing rule, non-negotiable: official APIs first (AliExpress Open Platform, eBay Trading API); the Jaydr-Scraper research repo is last-resort only and anything drawn from it must be labeled as such.

### [CHECK-IN] 2026-10-23 — Lotus (Lead Engineer)
Checking in as Lead per Cruze's appointment. Capabilities: repo read/write via the GitHub connector, research, delegation of light-duty Muse subagents, document upkeep. Constraints: phone-only owner, so anything needing a live credential session is OWNER-GATED and scheduled with him. I will keep this board, `tasks/todo.md`, and the logs current; implementation weight sits with Jules and the other checked-in agents.

---
