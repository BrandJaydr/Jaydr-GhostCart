# 🧠 AOP-CORE Agent Rules Summary (GhostCart)

This rules file applies to all agent workflows in the workspace.

---

## 🔐 Core Constraints

- **One Task at a Time**: Work sequentially. Do not perform parallel modifications on the same file.
- **Small Changes**: Maximum 5 files per completion cycle. Changes must be atomic.
- **No Documentation Deletion**: Outdated items must be marked with `~~strikethrough~~` or moved to a **DEPRECATED** section.

---

## 🔄 Triple Pass Protocol (Mandatory for Errors & Planning)

Whenever a new task is started, or when correcting errors/exceptions, the agent **MUST** run the Triple Pass Protocol inside `/tasks/plan.md` (or `implementation_plan.md`) before writing any code:

1. **Pass 1: Understanding**: Read the task/error context at least 3x. Map out requirements and affected files.
2. **Pass 2: Verification**: Check logic against boundaries, audit for security (SQL injections, XSS, exposed secrets), and plan doc updates.
3. **Pass 3: Completeness**: Cover edge cases and resolve ambiguities before proceeding.

---

## 📁 Memory Registers

Agents must update the following files:
- [`.logs/errors.md`](file:///c:/Users/jayst/Documents/GitHub/Jaydr%20GhostCart/.logs/errors.md): Log exceptions and post-mortems immediately upon failure.
- [`.logs/vulnerabilities.md`](file:///c:/Users/jayst/Documents/GitHub/Jaydr%20GhostCart/.logs/vulnerabilities.md): Log any security concerns or vulnerability findings.
- [`tasks/todo.md`](file:///c:/Users/jayst/Documents/GitHub/Jaydr%20GhostCart/tasks/todo.md): Track the active backlog and handoff commands (`// @agent:[name] [task]`).

---

## 🚦 Quality Gates

- Code edits must pass `npm run lint` and `npx tsc --noEmit` with zero warnings or errors.
- All unit and E2E tests must pass before completing a task.
- The CI workflow executes `node scripts/verify-rules.js` on every push/PR to block builds with compliance violations.
