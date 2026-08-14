# ⏰ SCHEDULER PROTOCOL v1.0

Task queuing, timing, and execution management system.

This defines:
- When tasks execute
- How tasks are prioritized
- How long tasks can run
- When to split long tasks
- How to hand off incomplete work

---

## 🎯 SCHEDULING PRINCIPLES

**ONE TASK AT A TIME**
- No parallel execution on same codebase
- Queue competing tasks
- Wait for completion before starting next

**TIME-BOXED EXECUTION**
- Max 15 minutes per task without checkpoint
- Max 30 minutes per task total
- At limit: save state and queue

**TOKEN-AWARE EXECUTION**
- Track token usage per session
- At 70% capacity: begin wrapping up
- At 80% capacity: save and queue remaining work

**PRIORITY-DRIVEN SCHEDULING**
- Security issues: immediate
- Blocking issues: high
- Features: normal
- Refactoring: low

---

## 📊 TASK PRIORITY LEVELS

### CRITICAL (Immediate)
**Criteria:**
- Security vulnerabilities
- Data loss risks
- Service unavailable
- Breaking issues

**Action:** Execute immediately, interrupt current task
**Max duration:** No limit until fixed
**Example:** Secret exposed in code

---

### HIGH (Next slot)
**Criteria:**
- Blocking other work
- Production bugs
- Test failures
- Incomplete critical path

**Action:** Execute when current task complete
**Max duration:** 30 minutes
**Example:** API endpoint broken

---

### NORMAL (Queue)
**Criteria:**
- New features
- Non-blocking bugs
- Documentation updates
- Code quality improvements

**Action:** Execute when queue clear
**Max duration:** 30 minutes
**Example:** Add new endpoint

---

### LOW (Backlog)
**Criteria:**
- Refactoring
- Performance optimization
- Technical debt
- Nice-to-have features

**Action:** Execute when higher priorities clear
**Max duration:** 30 minutes per session (can span multiple)
**Example:** Extract repeated code

---

## 📋 EXECUTION TIMELINE

### Per Session Structure

```
START SESSION
│
├─ Load context (2 min)
│  ├─ Read /tasks/plan.md
│  ├─ Read /.logs/errors.md
│  └─ Read /.logs/patterns.md
│
├─ Execute task (20-25 min)
│  ├─ Planning (2-3 min)
│  ├─ Implementation (10-15 min)
│  ├─ Testing (3-5 min)
│  └─ Documentation (2-3 min)
│
├─ Completion check (1 min)
│  ├─ Tests passing?
│  ├─ Linting passing?
│  └─ Documentation updated?
│
└─ End session
   ├─ If complete: close task
   ├─ If incomplete:
   │  ├─ Save state to /tasks/todo.md
   │  ├─ Create handoff TODOs
   │  └─ Queue for next session
   │
   └─ Archive logs /.logs/hooks.md
```

---

## ⏱️ TIME BUDGETS

### Default Task Budget: 30 minutes max

**5 min - Context Loading**
- Read task description
- Read relevant logs
- Load prior context

**15 min - Execution**
- Planning: 2 min (use TRIPLE_PASS_PROTOCOL)
- Implementation: 8 min
- Testing: 3 min
- Security review: 2 min

**5 min - Documentation**
- README update
- Code comments
- WIKI update

**5 min - Completion**
- Final test run
- Linting check
- Log updates
- Handoff setup

---

## 🔔 CHECKPOINTS & ESCALATION

### 10 minutes in
**Checkpoint:** Is execution on track?
- If yes: continue
- If stuck: reassess plan
- If blocked: create TODO and skip

### 20 minutes in
**Checkpoint:** Is task completable in remaining 10 min?
- If yes: accelerate
- If no: save state, create TODO
- Begin final steps

### 25 minutes in
**Final checkpoint:** Can this complete in 5 min?
- If yes: finish fast
- If no: stop now, queue remainder
- Document state for handoff

---

## 📤 TOKEN BUDGETS

### Token Tracking

**Monitor throughout session:**
```
Start: [N] tokens available
├─ Context loading: [N] tokens
├─ Planning: [N] tokens
├─ Implementation: [N] tokens
├─ Testing: [N] tokens
├─ Documentation: [N] tokens
└─ Remaining: [N] tokens

At 70% capacity (YELLOW): Start wrapping
At 80% capacity (ORANGE): Begin handoff documentation
At 90% capacity (RED): Stop immediately, save state
```

### Token Management Rules

**At 70% (7000 tokens of 10k example):**
- [ ] Wrap up current step
- [ ] Test what you have
- [ ] Begin documentation
- [ ] Prepare for handoff

**At 80% (8000 tokens):**
- [ ] Stop new implementation
- [ ] Complete current file changes
- [ ] Update TODO list with remaining work
- [ ] Create detailed handoff notes

**At 90% (9000 tokens):**
- [ ] Save immediately
- [ ] Create final handoff TODO
- [ ] End session
- [ ] Do not continue

---

## 🔄 TASK SPLITTING RULES

### When to split:

1. **Exceeds 15 minutes of execution**
   - Save current progress
   - Move remainder to TODO
   - Create clear handoff

2. **Exceeds 20 conversation turns**
   - Task is too complex for single session
   - Break into sub-tasks
   - Queue each sub-task

3. **Exceeds 50% of token budget**
   - Approaching limit
   - Complete current step
   - Queue remainder

4. **Blocked or stuck**
   - Spent 10+ min without progress
   - Document what's blocking
   - Escalate or queue

### How to split:

**Step 1:** Identify natural break points
```
Task: Build authentication system
├─ Part A: Setup JWT tokens
├─ Part B: Build login endpoint
├─ Part C: Build logout endpoint
└─ Part D: Add session persistence
```

**Step 2:** Create separate TODO items
```markdown
### [Task] - Build JWT tokens
**Status:** Not Started
**Complexity:** High
**Estimated Time:** 20 min

[Details]

**Next Steps:**
1. [Step]
2. [Step]
```

**Step 3:** Create dependencies
```markdown
## DEPENDENCIES
- Task A must complete before Task B
- Task B and C can run in parallel
- All must complete before Task D
```

**Step 4:** Create handoff TODO
```markdown
// @agent:forge pick up after JWT tokens built
// @status:pending-jwt-completion
// @next-step:build-login-endpoint
```

---

## 📅 SCHEDULING QUEUE

### Queue Management in /tasks/todo.md

```markdown
## EXECUTION QUEUE

### CRITICAL
⏰ 0 min (Start immediately)
1. [Task name]

### HIGH
⏰ 30 min (Next available slot)
2. [Task name]
3. [Task name]

### NORMAL
⏰ 60+ min (When backlog clear)
4. [Task name]

### LOW
⏰ Backlog (When higher priorities done)
5. [Task name]

## ACTIVE TASK
ID: [Task ID]
Started: [Timestamp]
Time elapsed: [Min]
Estimated remaining: [Min]
Tokens used: [N]
Tokens remaining: [N]
```

---

## 🚦 EXECUTION RULES

### WHEN STARTING A TASK:

1. Check queue priority
2. Load all context
3. Read TRIPLE_PASS_PROTOCOL
4. Execute three passes (don't skip)
5. Get approval if needed
6. Start implementation

### DURING EXECUTION:

1. Watch time: checkpoint at 10, 20, 25 min
2. Watch tokens: alert at 70%, 80%, 90%
3. Watch errors: log immediately
4. Watch security: flag immediately
5. Watch tests: must pass before moving on

### ON COMPLETION:

1. Run full test suite
2. Run linting
3. Update all documentation
4. Update version numbers
5. Create completion log entry
6. Close task
7. Dequeue next task

### ON INCOMPLETION:

1. Save current state
2. Document exactly what's done
3. Document exactly what's remaining
4. Create detailed TODO with context
5. Create handoff markers (@agent comments)
6. Queue with status [Blocked|Incomplete|Waiting]
7. Log time and tokens spent

---

## 🔗 CROSS-IDE SCHEDULING

### Cursor/Cline (Same IDE)
- Maintain shared /tasks/todo.md
- Same session can pick up queued task
- Share /tasks/plan.md between sessions

### Multiple IDEs (Cursor, Trae, Windsurf)
- All access shared repo structure
- Todo.md is source of truth
- Last agent to write wins (version control)
- Pull latest before starting
- Push after each session

### Handoff between agents/sessions:
```
[Agent A completes step]
  → Creates TODO in /tasks/todo.md
  → Includes @agent:[next-agent] marker
  → Includes full context and status
  → Commits changes
[Agent B starts new session]
  → Pulls latest todo.md
  → Reads handoff TODOs
  → Continues work
```

---

## 📊 METRICS & MONITORING

### Track per session:
- [ ] Time spent
- [ ] Tokens used
- [ ] Lines changed
- [ ] Files modified
- [ ] Tests added
- [ ] Errors encountered
- [ ] Security issues found
- [ ] Patterns matched

### Log to /tasks/history.md:
```markdown
## Session Metrics

**Date:** [Date]
**Task:** [Name]
**Duration:** [Minutes]
**Tokens:** [Start] → [End]
**Output:**
- Files: [N]
- Lines: [+N -N]
- Tests: [N]
- Errors: [N]
- Vulnerabilities: [N]
```

---

## ⚠️ COMMON SCENARIOS

### Scenario 1: Task runs over time

```
At 20 minutes:
├─ Check: Can complete in 10 min?
├─ If NO:
│  ├─ Stop implementation
│  ├─ Complete current file
│  ├─ Save to /tasks/todo.md
│  ├─ Create @agent:next handoff
│  └─ Close session
└─ If YES: accelerate finish
```

### Scenario 2: Token limit approaching

```
At 70% tokens (YELLOW):
├─ Complete current method
├─ Run tests
├─ Update one doc
└─ Prepare for stop

At 80% tokens (ORANGE):
├─ Stop new code
├─ Finish current file
├─ Create TODO + handoff
└─ Close session

At 90% tokens (RED):
├─ Stop immediately
├─ Save state
├─ Create emergency TODO
└─ Close session
```

### Scenario 3: Blocked on external issue

```
Blocked:
├─ Log to /.logs/errors.md
├─ Create TODO with @status:blocked
├─ Note: [What's blocking?]
├─ Note: [What's needed to unblock?]
└─ Queue for later

When unblocked:
├─ Update TODO status
├─ Resume from last step
└─ Continue normally
```

---

## 🔄 SESSION HANDOFF TEMPLATE

Use this when queuing work:

```markdown
## Task: [Name]

**Status:** [Incomplete|Blocked]
**Progress:** [X of Y steps complete]
**Time spent:** [N minutes]
**Tokens used:** [N]

**Completed:**
- [Step 1] ✅
- [Step 2] ✅

**Remaining:**
- [ ] [Step 3]
- [ ] [Step 4]
- [ ] [Step 5]

**Current state:**
```
[Code snippet or state description]
```

**Next steps:**
1. [Exactly what to do next]
2. [Then what]
3. [Then what]

**Blockers:**
- [Blocker 1]: [What's needed?]

**Context:**
[Important information for next session]

// @agent:forge continue from step 3
// @status:in-progress
// @estimate:15-minutes-remaining
```

---

## 📝 SCHEDULER CHECKLIST

Before starting task:
- [ ] Read priority level
- [ ] Check time budget (30 min max)
- [ ] Check token budget (70% limit)
- [ ] Load context files
- [ ] Read TRIPLE_PASS_PROTOCOL
- [ ] Create /tasks/plan.md entry

During task:
- [ ] Checkpoint at 10 min
- [ ] Checkpoint at 20 min
- [ ] Watch token usage
- [ ] Log errors immediately
- [ ] Test continuously

At completion:
- [ ] All tests pass
- [ ] Linting passes
- [ ] Documentation updated
- [ ] Version bumped
- [ ] Logs updated
- [ ] Task closed

If incomplete:
- [ ] State saved to /tasks/todo.md
- [ ] Handoff TODO created
- [ ] Context documented
- [ ] Time/tokens logged

---

END OF SCHEDULER PROTOCOL
