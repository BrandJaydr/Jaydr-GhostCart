# 🌐 GLOBAL RULES v1.0

Master constraint system for all agent operations across Cursor, Cline, Trae, and Windsurf.

This is the **single source of truth** for:
- Agent behaviors
- Execution constraints
- Quality gates
- Documentation policies
- Failure handling

---

## 🔐 CORE GUARDRAILS

### EXECUTION CONSTRAINTS

**ONE TASK AT A TIME**
- No parallel modifications to the same file
- Lock files during editing
- Queue competing tasks

**SMALL, CONTROLLED CHANGES**
- Max 5 files per completion cycle
- Atomic commits (one logical unit per completion)
- Rollback-safe implementations

**CONTEXT BEFORE ACTION**
- Always read instructions first
- Always read relevant code
- Always read logs and prior patterns
- Never assume state

**ERROR STOPS EXECUTION**
- On error → log immediately
- On error → stop further changes
- On error → escalate to human or queue

### QUALITY GATES

**TESTS MUST PASS**
- No completion without passing tests
- No skipping test validation
- New features require new tests

**LINTING MUST PASS**
- Code style consistency required
- No warnings allowed in critical files
- Auto-fix or document why not applied

**NO SILENT FAILURES**
- Every error logged
- Every failure tracked
- Every near-miss documented

---

## 📝 DOCUMENTATION POLICIES

### PROTECTION RULES

**DOCUMENTATION CANNOT BE DELETED**
- Mark outdated info with ~~strikethrough~~
- Move deprecated sections to **DEPRECATED** section
- Leave deletion breadcrumbs in logs

**ALL DOCS ARE IMMUTABLE UNTIL APPROVED**
- Changes require human review (if possible)
- Version every documentation file
- Track who changed what and when

**README IS GENERATED, NOT MANUAL**
- Auto-update from version file
- Auto-update from completion logs
- Template-driven generation

### DOCUMENTATION HIERARCHY

```
/README.md                    [Auto-generated, version-tracked]
/REPO_MANIFEST.md            [Structure & inventory]
/WIKI.md                      [Technical explanations]
/CONVENTIONS.md               [Code style, naming, patterns]
/.logs/errors.md              [Error catalog]
/.logs/vulnerabilities.md     [Security issues]
/.logs/patterns.md            [Recurring patterns]
/tasks/plan.md                [Current plan]
/tasks/todo.md                [Tracked backlog]
/.docs/                       [Supporting docs]
```

---

## 🚫 FORBIDDEN ACTIONS

**NEVER:**
- Delete documentation
- Skip planning phase
- Ignore test failures
- Make changes > 5 files without confirmation
- Leave ambiguous TODOs
- Skip error logging
- Deploy without security review
- Modify logs (only append)

---

## ✅ MANDATORY ACTIONS

**ALWAYS:**
- Read context first (3x minimum)
- Write to error log on failure
- Write to vulnerability log for security issues
- Update TODO list for incomplete work
- Increment version numbers
- Update README with changes
- Update REPO_MANIFEST with structural changes
- Leave handoff TODOs for next agent

---

## 🔄 VERSIONING

**All major files tracked:**
```
README.md                    → v[MAJOR].[MINOR].[PATCH]
/REPO_MANIFEST.md           → v[MAJOR].[MINOR].[PATCH]
/WIKI.md                     → v[MAJOR].[MINOR].[PATCH]
/tasks/todo.md              → Updated each session
/.logs/errors.md            → Append only
/.logs/vulnerabilities.md   → Append only
```

---

## 🎯 COMPLETION CHECKLIST

Every code completion must include:

- [ ] Tests passing
- [ ] Linting passing
- [ ] Error log updated (if any errors)
- [ ] Vulnerability log updated (if security concerns)
- [ ] TODO list updated with incomplete work
- [ ] README.md version incremented and regenerated
- [ ] REPO_MANIFEST.md updated if structure changed
- [ ] WIKI.md updated with new technical details
- [ ] All handoff TODOs created for next agent
- [ ] No deleted documentation (only marked deprecated)

---

## 🛡️ SECURITY RULES

**BEFORE ANY COMPLETION:**
1. Check for SQL injection vectors
2. Check for XSS vulnerabilities
3. Check for CSRF vulnerabilities
4. Check for privilege escalation
5. Check for exposed secrets
6. Check for unvalidated input
7. Log all findings (even if none found)

**If vulnerabilities found:**
- Log to /.logs/vulnerabilities.md immediately
- Do NOT complete task
- Queue for Red Ranger (security agent)
- Wait for approval

---

## 🎓 LEARNING RULES

**After every task:**
1. Log errors to /.logs/errors.md
2. Identify recurring patterns
3. Update /.logs/patterns.md
4. Share learnings in WIKI.md

**Pattern detection:**
- If error appears 3x → update prevention in WIKI.md
- If vulnerability appears 2x → add security check to this file
- If solution reused → move to CONVENTIONS.md

---

## ⚙️ IDE CONFIGURATION

Each IDE (Cursor, Cline, Trae, Windsurf) should:

1. Load this file as system prompt prefix
2. Load HOOKS_SYSTEM.md for trigger definitions
3. Load TRIPLE_PASS_PROTOCOL.md before planning any task
4. Reference MEMORY_STRUCTURE.md for file organization
5. Use SCHEDULER_PROTOCOL.md for task queuing

---

END OF GLOBAL RULES
