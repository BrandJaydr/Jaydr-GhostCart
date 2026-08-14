# 🎯 HOOKS SYSTEM v1.0

Event-driven trigger definitions for agent activation across all IDEs.

This defines:
- What events cause agent action
- Who triggers on that event
- What actions are executed
- What guardrails apply

---

## 📋 HOOK TAXONOMY

### LIFECYCLE HOOKS

#### HOOK: PROJECT_INIT
**Trigger:** New project started
**Agent:** Cartographer (context mapper)
**Actions:**
- Scan project structure
- Read all documentation
- Initialize /tasks/plan.md
- Initialize /tasks/todo.md
- Initialize /.logs/errors.md
- Initialize /.logs/vulnerabilities.md
- Initialize /.logs/patterns.md
**Status:** ⏸️ Waiting for human task definition

---

#### HOOK: TASK_START
**Trigger:** Human assigns new task OR task pulled from queue
**Agent:** Atlas (context accumulator)
**Actions:**
- Read task description
- Read /.logs/errors.md (recent)
- Read /.logs/patterns.md
- Read /.logs/vulnerabilities.md
- Load project history
- Generate context summary in /tasks/plan.md
**Status:** ✅ Ready for TRIPLE_PASS_PROTOCOL

---

#### HOOK: TASK_COMPLETE
**Trigger:** All code changes finished AND tests pass
**Agent:** Scribe (documentarian)
**Actions:**
- Update README.md (version bump)
- Update REPO_MANIFEST.md
- Update WIKI.md with new patterns
- Create completion summary
- Update /tasks/todo.md with incomplete work
**Status:** ✅ Task closed

---

### CODE HOOKS

#### HOOK: CODE_WRITTEN
**Trigger:** Any file written to disk
**Agent:** Oracle (test architect)
**Actions:**
- Run tests
- Run linting
- Check coverage
**Gate:** If failure → block completion

---

#### HOOK: TEST_FAILURE
**Trigger:** Test fails after code change
**Agent:** Forge (debugger)
**Actions:**
- Identify failure cause
- Implement fix
- Re-run tests
- Log error to /.logs/errors.md
**Status:** Retry or escalate

---

#### HOOK: LINTING_FAILURE
**Trigger:** Linter flags issues
**Agent:** Janitor (cleanup)
**Actions:**
- Auto-fix simple issues
- Flag complex issues for Forge
- Document why unfixed (if applicable)
**Status:** Must resolve before completion

---

### SECURITY HOOKS

#### HOOK: VULNERABILITY_DETECTED
**Trigger:** Security scan flags issue OR code review identifies risk
**Agent:** Red Ranger (security)
**Actions:**
- Log to /.logs/vulnerabilities.md
- Block code completion
- Create detailed vulnerability report
- Propose fix
**Status:** ⏸️ Waiting for approval

---

#### HOOK: SECRET_EXPOSED
**Trigger:** Credentials, API keys, or tokens found in code
**Agent:** Red Ranger + Janitor
**Actions:**
- Immediately remove from code
- Rotate credentials
- Log incident
- Block completion until verified
**Status:** 🚨 CRITICAL

---

### DOCUMENTATION HOOKS

#### HOOK: DOC_DELETION_ATTEMPTED
**Trigger:** Human or agent attempts to delete doc file
**Agent:** Linkwarden (documentation guardian)
**Actions:**
- Block deletion
- Require approval (if possible)
- Suggest ~~strikethrough~~ instead
- Log to /.logs/patterns.md
**Status:** ⛔ Cannot proceed

---

#### HOOK: DOC_UPDATE_REQUIRED
**Trigger:** Code changes affect documentation
**Agent:** Scribe (documentarian)
**Actions:**
- Update README.md
- Update REPO_MANIFEST.md
- Update WIKI.md
- Version bump all docs
**Status:** Auto-execute on task completion

---

### PERFORMANCE HOOKS

#### HOOK: TOKEN_LIMIT_APPROACHING
**Trigger:** Token usage > 70% of session limit
**Agent:** Janitor + Forge
**Actions:**
- Identify incomplete work
- Move to /tasks/todo.md with details
- Create handoff TODOs
- Prepare session summary
**Status:** ⏸️ Queue remaining work

---

#### HOOK: EXECUTION_TIMEOUT
**Trigger:** Single task exceeds 15 minutes execution time
**Agent:** Janitor
**Actions:**
- Save intermediate progress
- Log current state
- Create detailed TODO with context
- Pause execution
**Status:** ⏸️ Resume in next session

---

#### HOOK: TOO_MANY_TURNS
**Trigger:** Conversation exceeds 20 turns on single task
**Agent:** Forge (lead) + Janitor
**Actions:**
- Identify what's stuck
- Break into smaller sub-tasks
- Create TODO items for each sub-task
- Generate summary for handoff
**Status:** ⏸️ Split into queue

---

### LEARNING HOOKS

#### HOOK: ERROR_LOGGED
**Trigger:** New error added to /.logs/errors.md
**Agent:** Investigator (pattern finder)
**Actions:**
- Read error details
- Check if pattern matches existing entries
- If 3rd occurrence → create prevention rule
- Update /.logs/patterns.md
- Propose WIKI.md update
**Status:** Background learning

---

#### HOOK: PATTERN_IDENTIFIED
**Trigger:** Same error/issue appears 3 times OR same solution reused
**Agent:** Investigator + Scribe
**Actions:**
- Document pattern in /.logs/patterns.md
- Create prevention rule
- Update CONVENTIONS.md with best practice
- Update WIKI.md with explanation
**Status:** ✅ System learns

---

#### HOOK: SECURITY_PATTERN_DETECTED
**Trigger:** Same vulnerability appears 2+ times
**Agent:** Red Ranger + Investigator
**Actions:**
- Log to /.logs/vulnerabilities.md
- Create security rule in CONVENTIONS.md
- Update this HOOKS_SYSTEM.md to prevent recurrence
- Add automated check if possible
**Status:** ✅ Prevent future occurrence

---

### HUMAN INTERACTION HOOKS

#### HOOK: APPROVAL_REQUESTED
**Trigger:** Agent requests human confirmation (high-risk changes)
**Agent:** Waiting for human input
**Actions:**
- Display plan clearly
- Wait for feedback
- Resume on approval OR restart on rejection
**Status:** ⏸️ Blocked on human decision

---

#### HOOK: CLARIFICATION_NEEDED
**Trigger:** Agent finds task requirements ambiguous
**Agent:** Cartographer (context mapper)
**Actions:**
- List ambiguities found
- Propose clarifications
- Wait for human input
- Re-plan based on feedback
**Status:** ⏸️ Blocked on clarification

---

#### HOOK: ESCALATION_REQUIRED
**Trigger:** Agent encounters issue beyond their scope
**Agent:** All agents can trigger this
**Actions:**
- Document issue clearly
- Log to /.logs/errors.md
- Create high-priority TODO
- Notify human or queue for specialist
**Status:** ⏸️ Waiting for escalation handling

---

## 🔗 HOOK CHAINS (Multi-Agent Sequences)

### Chain: CODE_WRITTEN → TEST_FAILURE → ERROR_LOG

1. **CODE_WRITTEN** triggered
2. Oracle runs tests
3. Tests fail
4. **TEST_FAILURE** hook triggered
5. Forge debugs issue
6. On error: **ERROR_LOGGED** hook triggered
7. Investigator checks patterns
8. If pattern found: **PATTERN_IDENTIFIED** hook triggered
9. Prevention rule created

---

### Chain: VULNERABILITY_DETECTED → SECURITY_PATTERN → PREVENTION

1. **VULNERABILITY_DETECTED** hook triggered
2. Red Ranger logs to /.logs/vulnerabilities.md
3. Check if 2nd occurrence
4. If yes: **SECURITY_PATTERN_DETECTED** hook triggered
5. Add to CONVENTIONS.md
6. Update automated security checks
7. Add hook to prevent future occurrence

---

### Chain: TOKEN_LIMIT_APPROACHING → TOO_MANY_TURNS → TASK_QUEUE

1. **TOKEN_LIMIT_APPROACHING** at 70%
2. Janitor identifies incomplete work
3. Moves to /tasks/todo.md
4. If already >20 turns: **TOO_MANY_TURNS** hook triggered
5. Split into sub-tasks
6. Create handoff TODOs
7. Queue for next session/agent

---

## 📡 HOOK SIGNAL FORMAT

All hooks communicate using standardized markers:

```
// @hook:CODE_WRITTEN
// @agent:oracle [action]
// @status:in-progress
// @timestamp:[ISO-8601]
```

Example in code:

```javascript
// @hook:CODE_WRITTEN
// @agent:oracle run tests
// @status:pending
// @timestamp:2024-04-19T12:30:00Z

function newFeature() {
  // Implementation
}
```

---

## 🚨 CRITICAL HOOKS (Blocking)

These hooks ALWAYS block execution:

1. **SECRET_EXPOSED** - Remove credentials immediately
2. **VULNERABILITY_DETECTED** - Security approval required
3. **TEST_FAILURE** - Fix before proceeding
4. **LINTING_FAILURE** - Resolve before completion
5. **DOC_DELETION_ATTEMPTED** - Cannot delete docs

---

## 🎯 OPTIONAL HOOKS (Advisory)

These hooks inform but don't block:

1. **ERROR_LOGGED** - Learn from error
2. **PATTERN_IDENTIFIED** - Improve system
3. **APPROVAL_REQUESTED** - Wait for feedback
4. **CLARIFICATION_NEEDED** - Ask for details

---

## ⏰ HOOK SCHEDULING

Hooks execute in priority order:

```
CRITICAL (blocking)
├─ SECRET_EXPOSED
├─ VULNERABILITY_DETECTED
├─ TEST_FAILURE
└─ LINTING_FAILURE

HIGH (immediate)
├─ CODE_WRITTEN
├─ DOC_DELETION_ATTEMPTED
└─ EXECUTION_TIMEOUT

MEDIUM (next available)
├─ ERROR_LOGGED
├─ PATTERN_IDENTIFIED
├─ TOKEN_LIMIT_APPROACHING
└─ TOO_MANY_TURNS

LOW (background)
├─ SECURITY_PATTERN_DETECTED
├─ APPROVAL_REQUESTED
└─ CLARIFICATION_NEEDED
```

---

## 🔧 IDE CONFIGURATION

For **Cursor**, **Cline**, **Trae**, **Windsurf**:

1. Load HOOKS_SYSTEM.md as execution framework
2. Configure hook triggers in IDE settings
3. Map hooks to available agent capabilities
4. Set notification priorities
5. Enable hook logging to /.logs/hooks.md

---

END OF HOOKS SYSTEM
