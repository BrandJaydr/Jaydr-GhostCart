# 🧠 AOP-CORE Agent Rules Summary (GhostCart)

This document defines the core guardrails, quality gates, and protocols for all agent operations (including Antigravity, Cursor, and Cline). For the full 45,000+ word specification, refer to the documents in [`Docs/Global Agentic Rules/`](file:///c:/Users/jayst/Documents/GitHub/Jaydr%20GhostCart/Docs/Global%20Agentic%20Rules).

---

## 🔐 Core Guardrails

1. **One Task at a Time**: Do not make parallel edits across files. Perform work sequentially.
2. **Small, Controlled Changes**: Limit edits to a maximum of 5 files per completion cycle. Ensure changes are atomic.
3. **Rollback Safety**: Every change must be clean, reviewable, and simple to revert if needed.
4. **No Deletion of Docs**: Never delete documentation. Use `~~strikethrough~~` for deprecated items or move them to a **DEPRECATED** section.

---

## 🔄 Triple Pass Protocol (Mandatory for Errors & Planning)

Whenever a new task is started, or when correcting errors/exceptions, the agent **MUST** run the Triple Pass Protocol inside `/tasks/plan.md` (or `implementation_plan.md`) before writing any code:

1. **Pass 1: Understanding**
   - Read the task/error context at least 3x.
   - Outline the requirements, constraints, and affected files.
2. **Pass 2: Verification & Security**
   - Validate proposed logic against architectural boundaries.
   - Check for security vulnerabilities: SQL injection, XSS, exposed secrets, and unvalidated inputs.
   - Plan necessary document updates.
3. **Pass 3: Completeness**
   - Check that every edge case is covered.
   - Ensure the plan leaves no ambiguities before execution.

---

## 📁 Memory Registers & Logs

Agents must maintain and append to the following registers:
- [`.logs/errors.md`](file:///c:/Users/jayst/Documents/GitHub/Jaydr%20GhostCart/.logs/errors.md): Append post-mortems for every exception or build failure encountered.
- [`.logs/vulnerabilities.md`](file:///c:/Users/jayst/Documents/GitHub/Jaydr%20GhostCart/.logs/vulnerabilities.md): Log any security concerns or vulnerability findings immediately.
- [`.logs/patterns.md`](file:///c:/Users/jayst/Documents/GitHub/Jaydr%20GhostCart/.logs/patterns.md): Record recurring issues and mitigation patterns.
- [`tasks/todo.md`](file:///c:/Users/jayst/Documents/GitHub/Jaydr%20GhostCart/tasks/todo.md): Track the backlog, current task lists, and handoff registers (`// @agent:[name] [task]`).

---

## 🚦 Quality Gates (Automatic)

- **Linter & Typechecks**: Every edit must pass `npm run lint` and `npx tsc --noEmit` with zero warnings or errors.
- **Unit & E2E Tests**: All tests must pass before a task is considered done.
- **Compliance Scan**: The CI workflow runs `node scripts/verify-rules.js` on every commit and PR. Builds will fail if violations (like hardcoded secrets, package violations, or trailing commas in package.json) are found.

---

## 📚 Global Agent References
For details on specific subsystems, read the corresponding rules files on-demand:
- Hook Triggers → [`Docs/Global Agentic Rules/2_HOOKS_SYSTEM.md`](file:///c:/Users/jayst/Documents/GitHub/Jaydr%20GhostCart/Docs/Global%20Agentic%20Rules/2_HOOKS_SYSTEM.md)
- Memory Access → [`Docs/Global Agentic Rules/4_MEMORY_STRUCTURE.md`](file:///c:/Users/jayst/Documents/GitHub/Jaydr%20GhostCart/Docs/Global%20Agentic%20Rules/4_MEMORY_STRUCTURE.md)
- Timing & Token Budgets → [`Docs/Global Agentic Rules/5_SCHEDULER_PROTOCOL.md`](file:///c:/Users/jayst/Documents/GitHub/Jaydr%20GhostCart/Docs/Global%20Agentic%20Rules/5_SCHEDULER_PROTOCOL.md)
