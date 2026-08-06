# AOP-CORE v1.0

Agent Orchestration & Pipeline Core

This file defines the execution model for all agents in the system.

It is the **single source of truth** for:

* Pipeline stages
* Agent responsibilities
* Execution order
* Handoff rules
* Logging behavior

---

# 🧠 SYSTEM PRINCIPLES

• One task at a time
• Small, controlled changes
• Shared memory across agents
• Continuous learning via logs
• No agent operates without context

---

# 📂 SYSTEM MEMORY

All agents MUST read and write to:

/.logs/errors.md
/logs/patterns.md
/tasks/plan.md
/tasks/todo.md

Optional:
/.jules/[agent].md

---

# 🔁 PIPELINE EXECUTION FLOW

---

## 🔹 STAGE 1 — CONTEXT INGESTION

Agents:

* Cartographer (optional)
* Atlas (if API-related)

Actions:
• Read instructions
• Read relevant code
• Load logs and prior learnings

Output:
Context awareness only

---

## 🔹 STAGE 2 — DISCOVERY

Agents:

* Investigator
* Janitor (read-only)

Actions:
• Extract TODO markers
• Scan logs for recurring issues
• Identify dead code, bugs, gaps

Output:
/tasks/todo.md

---

## 🔹 STAGE 3 — PLANNING

Agents:

* Forge (planning mode)
* Atlas (if needed)

Actions:
• Define objective
• Break into steps
• Identify affected files

Output:
/tasks/plan.md

---

## 🔹 STAGE 4 — PLAN REVIEW (GATE)

Rules:
• If high risk → require approval
• If low risk → auto proceed

---

## 🔹 STAGE 5 — EXECUTION

Agents:

* Forge
* Atlas
* Archivist (if schema involved)

Rules:
• Keep changes minimal
• Follow architecture
• Add handoff TODOs

Example:

```
// @agent:oracle add test
// @agent:scribe document endpoint
```

---

## 🔹 STAGE 6 — VALIDATION

Agents:

* Test Architect
* Oracle

Actions:
• Run tests
• Add missing tests
• Validate edge cases

---

## 🔹 STAGE 7 — HARDENING

Agents:

* Red Ranger (security)
* Scout (performance)
* Dependency Guardian

Actions:
• Fix vulnerabilities
• Optimize performance
• Stabilize dependencies

---

## 🔹 STAGE 8 — CLEANUP

Agents:

* Janitor
* Linkwarden / Link Monitor

Actions:
• Remove dead code
• Fix broken links
• Clean structure

---

## 🔹 STAGE 9 — DOCUMENTATION

Agents:

* Scribe

Actions:
• Update README
• Update API docs
• Align comments with code

---

## 🔹 STAGE 10 — ERROR LOGGING & LEARNING

Agents:

* Investigator (lead)
* ALL agents contribute

Actions:
• Log errors
• Identify patterns
• Capture lessons

Output:
/.logs/errors.md
/logs/patterns.md

---

## 🔹 STAGE 11 — COMPLETION

Actions:
• Confirm task completion
• Clean TODOs
• Summarize changes

---

# 🔄 HANDOFF SYSTEM

Agents communicate using inline markers:

```
// @agent:[name] [task]
```

Rules:
• Must be clear and actionable
• Must include responsible agent
• Must not be ambiguous

---

# ⚔️ CONFLICT RULES

• Only ONE agent modifies a file per stage
• Security overrides all agents
• Validation blocks progression if failed
• No silent overwrites

---

# 📏 GLOBAL RULES

ALWAYS:

• Read context first
• Log errors
• Work in small steps
• Preserve system stability

NEVER:

• Skip stages
• Make large uncontrolled changes
• Ignore failing tests
• Leave unclear TODOs

---

# 🧠 SYSTEM PHILOSOPHY

This system is not just executing tasks.

It is:

• Maintaining code quality
• Preventing future failures
• Learning from mistakes
• Evolving over time

Every cycle should make the system:

Smarter
Cleaner
Safer
More predictable

---

END OF AOP-CORE
