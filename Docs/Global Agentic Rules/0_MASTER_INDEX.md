# 🗂️ GLOBAL RULES SYSTEM - MASTER INDEX

**Version:** 1.0  
**Created:** [DATE]  
**Status:** Ready for Implementation

---

## 📌 QUICK START

### You have 10 files:

```
1. GLOBAL_RULES.md              [Master constraints]
2. HOOKS_SYSTEM.md              [Event triggers]
3. TRIPLE_PASS_PROTOCOL.md      [3-pass review system]
4. MEMORY_STRUCTURE.md          [File organization & logging]
5. SCHEDULER_PROTOCOL.md        [Task queuing & timing]
6. DOCUMENTATION_PROTECTION.md  [Doc preservation rules]
7. README_TEMPLATE.md           [Project overview template]
8. REPO_MANIFEST_TEMPLATE.md    [Structure template]
9. WIKI_TEMPLATE.md             [Tech docs template]
10. IMPLEMENTATION_GUIDE.md     [Setup instructions]
```

**Next step:** Follow the IMPLEMENTATION_GUIDE.md to set up your project.

---

## 🎯 SYSTEM OVERVIEW

### The Problem You're Solving

You wanted to coordinate agent work across multiple IDEs (Cursor, Cline, Trae, Windsurf) with:
- Clear guardrails and constraints
- Automatic event triggers
- Persistent memory and logging
- Time-based execution management
- Protected documentation
- Consistent review process

### The Solution

A **layered rule system** that covers:

1. **What agents can/cannot do** (GLOBAL_RULES)
2. **When agents act** (HOOKS_SYSTEM)
3. **How agents think** (TRIPLE_PASS_PROTOCOL)
4. **Where information lives** (MEMORY_STRUCTURE)
5. **How long tasks take** (SCHEDULER_PROTOCOL)
6. **What gets protected** (DOCUMENTATION_PROTECTION)

Plus templates for keeping documentation current.

---

## 📚 FILE GUIDE

### 1. GLOBAL_RULES.md

**What:** Master constraint system  
**When to read:** First time setup, when unsure what's allowed  
**Length:** 5 min read  
**Key sections:**
- Core guardrails (execution constraints)
- Quality gates (tests, linting, security)
- Documentation policies (protection rules)
- Mandatory vs forbidden actions
- Security rules
- Learning rules

**Use for:** Understanding what agents can and cannot do

---

### 2. HOOKS_SYSTEM.md

**What:** Event-driven trigger system  
**When to read:** Understanding when things happen automatically  
**Length:** 10 min read  
**Key sections:**
- Hook taxonomy (11 lifecycle, code, security, etc.)
- Hook signals and markers
- Critical vs optional hooks
- Hook priority order
- IDE configuration

**Use for:** Understanding when and why agents act

**Example:** When CODE_WRITTEN hook triggers, Oracle automatically runs tests

---

### 3. TRIPLE_PASS_PROTOCOL.md

**What:** Three-pass review system for all planning  
**When to read:** Before planning any task  
**Length:** 15 min read  
**Key sections:**
- PASS 1: Understanding & formulation
- PASS 2: Verification & hardening (security, QA, best practices)
- PASS 3: Completeness & clarity
- Output format
- When passes fail

**Use for:** Ensuring every plan is bulletproof before execution

**Key principle:** All three passes required. No skipping.

---

### 4. MEMORY_STRUCTURE.md

**What:** Complete state and logging organization  
**When to read:** Understanding where files go  
**Length:** 15 min read  
**Key sections:**
- Directory structure (what goes where)
- File reference (each file explained)
- Append-only vs mutable files
- Memory access patterns
- Backup & recovery

**Use for:** Finding where information is stored and accessed

**Key concept:** 
- `.logs/` = append-only truth (errors, vulnerabilities, patterns)
- `/tasks/` = current work tracking
- `/docs/` = supporting documentation

---

### 5. SCHEDULER_PROTOCOL.md

**What:** Task queuing, timing, and execution management  
**When to read:** When assigning or starting a task  
**Length:** 15 min read  
**Key sections:**
- Scheduling principles
- Task priority levels
- Execution timeline (per session structure)
- Time budgets (30 min max per task)
- Checkpoints (10, 20, 25 min)
- Token budgets (70%, 80%, 90% alerts)
- Task splitting rules
- Session handoff template

**Use for:** Understanding task timing and when to queue incomplete work

**Key rule:** Max 30 minutes per task. If longer, split and queue.

---

### 6. DOCUMENTATION_PROTECTION.md

**What:** Rules and guidelines for protecting documentation  
**When to read:** When updating or deleting documentation  
**Length:** 10 min read  
**Key sections:**
- Protected documentation (Tier 1, 2, 3)
- Strikethrough protocol (mark, don't delete)
- Deprecation process
- Deletion guards
- Auto-generated files
- Documentation lifecycle
- Approval workflow

**Use for:** Understanding how to handle doc changes

**Core rule:** Use ~~strikethrough~~ for deprecated content. Never delete.

---

### 7. README_TEMPLATE.md

**What:** Template for project overview  
**When to use:** Copy and customize for your project  
**Length:** 5 min to skim, customize in 10 min  
**Includes:**
- Quick overview
- Prerequisites
- Installation
- Configuration
- Development workflows
- Testing
- Deployment
- Security
- Contributing
- Changelog

**Result:** Professional project README with all standard sections

---

### 8. REPO_MANIFEST_TEMPLATE.md

**What:** Template for project structure documentation  
**When to use:** Copy and customize to document your codebase  
**Length:** Skim in 5 min, customize in 15 min  
**Includes:**
- Project structure overview
- File statistics
- Key files & directories
- Architecture overview
- Layers and components
- Dependencies
- Build & deploy processes
- Test coverage
- Module dependencies
- Configuration files
- Navigation guide

**Result:** Complete inventory of what's in your repository

---

### 9. WIKI_TEMPLATE.md

**What:** Template for technical documentation  
**When to use:** Copy and customize for technical depth  
**Length:** Skim in 5 min, customize in 20+ min  
**Includes:**
- Core concepts explanations
- Architecture deep dives
- Setup & installation
- Configuration guide
- Development guide
- API documentation
- How-to guides
- Troubleshooting
- Performance tuning
- Security best practices
- Glossary & FAQ

**Result:** Comprehensive technical reference for developers

---

### 10. IMPLEMENTATION_GUIDE.md

**What:** Step-by-step setup instructions  
**When to read:** When ready to implement in your project  
**Length:** 20 min to complete all steps  
**Phases:**
- Phase 1: Repository setup (create files & directories)
- Phase 2: IDE configuration (Cursor, Cline, Trae, Windsurf)
- Phase 3: Initial log setup
- Phase 4: Team communication
- Verification checklist
- IDE quick reference
- Ongoing maintenance
- Success metrics
- Troubleshooting

**Result:** Complete system deployed and ready to use

---

## 🗺️ NAVIGATION GUIDE

### I want to understand...

| Topic | Read This | Then This | Time |
|-------|-----------|----------|------|
| What agents can do | GLOBAL_RULES.md | HOOKS_SYSTEM.md | 15 min |
| How to plan a task | TRIPLE_PASS_PROTOCOL.md | IMPLEMENTATION_GUIDE.md | 20 min |
| When agents act | HOOKS_SYSTEM.md | GLOBAL_RULES.md | 15 min |
| Where files go | MEMORY_STRUCTURE.md | IMPLEMENTATION_GUIDE.md | 15 min |
| Task timing | SCHEDULER_PROTOCOL.md | Checklist in IMPLEMENTATION_GUIDE.md | 15 min |
| Doc protection | DOCUMENTATION_PROTECTION.md | GLOBAL_RULES.md (doc section) | 10 min |
| Complete system | This file | IMPLEMENTATION_GUIDE.md | 30 min |

### I need to...

| Task | File(s) |
|------|---------|
| Set up the system | IMPLEMENTATION_GUIDE.md |
| Plan a task | TRIPLE_PASS_PROTOCOL.md |
| Assign a task | SCHEDULER_PROTOCOL.md |
| Understand constraints | GLOBAL_RULES.md |
| Find where info is | MEMORY_STRUCTURE.md |
| Document a project | README_TEMPLATE.md + REPO_MANIFEST_TEMPLATE.md + WIKI_TEMPLATE.md |
| Know when hooks fire | HOOKS_SYSTEM.md |
| Handle documentation | DOCUMENTATION_PROTECTION.md |
| Troubleshoot | IMPLEMENTATION_GUIDE.md (troubleshooting section) |

---

## 🎯 KEY CONCEPTS EXPLAINED

### Rule Layers

```
GLOBAL_RULES.md
  ├─ What's forbidden (NEVER)
  ├─ What's required (ALWAYS)
  ├─ Quality gates
  └─ Security rules
        ↓
HOOKS_SYSTEM.md
  ├─ When things trigger
  ├─ Who handles them
  └─ What priority
        ↓
TRIPLE_PASS_PROTOCOL.md
  ├─ How to think about problems
  ├─ How to verify solutions
  └─ How to check for completeness
        ↓
SCHEDULER_PROTOCOL.md
  ├─ How long you get
  ├─ When to split work
  └─ How to hand off
```

### Memory Layers

```
MEMORY_STRUCTURE.md defines:

/.logs/
  ├─ errors.md (append-only, forever)
  ├─ vulnerabilities.md (append-only, forever)
  ├─ patterns.md (append-only, forever)
  └─ hooks.md (session log, archive daily)
        ↓
/tasks/
  ├─ plan.md (current task plan)
  ├─ todo.md (queue of work)
  └─ history.md (completed tasks archive)
        ↓
Root documentation
  ├─ README.md (auto-updated)
  ├─ REPO_MANIFEST.md (auto-updated)
  ├─ WIKI.md (continuously expanded)
  └─ CONVENTIONS.md (team standards)
```

### Documentation Protection Layers

```
Tier 1: CRITICAL (Never delete)
  ├─ README.md
  ├─ REPO_MANIFEST.md
  ├─ WIKI.md
  └─ /.logs/ (all files)
        ↓
Tier 2: IMPORTANT (Version tracked)
  ├─ CONVENTIONS.md
  ├─ /tasks/
  └─ /.docs/
        ↓
Tier 3: MUTABLE (Session temporary)
  ├─ /tasks/todo.md
  └─ /.logs/hooks.md (before archival)
```

---

## 🔄 SYSTEM WORKFLOWS

### Workflow 1: Starting a Task

```
1. Read /tasks/todo.md (what's queued?)
2. Load /tasks/plan.md (what's current plan?)
3. Read /.logs/errors.md (recent issues?)
4. Read GLOBAL_RULES.md (what's allowed?)
5. Execute TRIPLE_PASS_PROTOCOL (all 3 passes)
6. Get approval if needed
7. Start implementation
8. Follow SCHEDULER_PROTOCOL (time management)
9. Document as you go
10. Log errors and vulnerabilities
11. Update /tasks/todo.md with remaining work
```

### Workflow 2: Code Completion

```
1. Run tests → MUST PASS
2. Run linting → MUST PASS
3. Update README.md version
4. Update REPO_MANIFEST.md
5. Update WIKI.md
6. Log to /.logs/errors.md (if any)
7. Log to /.logs/vulnerabilities.md (if any)
8. Create handoff TODOs
9. Commit with message
10. Close task or queue remainder
```

### Workflow 3: Handling Errors

```
1. Stop execution immediately
2. Log to /.logs/errors.md with:
   - Error message
   - Context
   - Root cause
   - Fix applied
   - Prevention rules
3. Check if pattern (seen 3+ times?)
4. If pattern: update CONVENTIONS.md + WIKI.md
5. Resume or queue for next session
```

### Workflow 4: Handling Vulnerabilities

```
1. Flag immediately (do not proceed)
2. Log to /.logs/vulnerabilities.md with:
   - Vulnerability type
   - Severity level
   - Location
   - Impact
   - Fix
   - Prevention rule
3. Check if pattern (seen 2+ times?)
4. If pattern: add security rule to CONVENTIONS.md
5. Wait for approval
6. Fix and verify
7. Resume work
```

---

## 🎓 LEARNING PATH

### For New Team Members

**Day 1 (30 min total)**
1. Read: README.md (your project)
2. Skim: GLOBAL_RULES.md (what's allowed)
3. Skim: TRIPLE_PASS_PROTOCOL.md (how to plan)

**Day 2 (30 min total)**
1. Read: HOOKS_SYSTEM.md (when things happen)
2. Read: SCHEDULER_PROTOCOL.md (time management)
3. Read: MEMORY_STRUCTURE.md (where files are)

**Day 3 (30 min total)**
1. Read: DOCUMENTATION_PROTECTION.md (protect docs)
2. Read: WIKI.md (your project's tech)
3. Do: Your first task with system

### For Team Leads

**Setup Phase (1-2 hours)**
1. Follow IMPLEMENTATION_GUIDE.md completely
2. Customize templates for your project
3. Brief team on new workflows
4. Run first task through system

**Ongoing**
1. Weekly: Review patterns in /.logs/patterns.md
2. Monthly: Update CONVENTIONS.md with learnings
3. Quarterly: Audit system and metrics

---

## ⚡ CRITICAL RULES

### GLOBAL_RULES.md Critical Section

**NEVER:**
- Delete documentation
- Skip planning phase
- Ignore test failures
- Leave ambiguous TODOs
- Skip error logging
- Deploy without security review

**ALWAYS:**
- Read context first
- Log errors
- Update TODOs
- Increment versions
- Update docs

### TRIPLE_PASS_PROTOCOL Critical Section

**All 3 passes REQUIRED:**
- PASS 1: Understand problem (read 3x)
- PASS 2: Verify logic, security, UX/UI, best practices
- PASS 3: Ensure completeness and clarity

**No skipping any pass.**

### SCHEDULER_PROTOCOL Critical Section

**Time limits:**
- Max 15 min without checkpoint
- Max 30 min per task total
- Checkpoint at 10, 20, 25 min
- At 70% tokens: start wrapping
- At 90% tokens: stop immediately

### MEMORY_STRUCTURE Critical Section

**Append-only (never delete):**
- /.logs/errors.md
- /.logs/vulnerabilities.md
- /.logs/patterns.md
- /tasks/history.md

**Protected (no deletion):**
- README.md
- REPO_MANIFEST.md
- WIKI.md
- CONVENTIONS.md

---

## 🛠️ TOOLS & SCRIPTS

### Verification Scripts

```bash
# Check tests
npm test

# Check linting
npm run lint

# Check types
npm run type-check

# Check all
npm run ci              # Should pass before completion
```

### Log Management

```bash
# View recent errors
tail -20 .logs/errors.md

# View recent vulnerabilities
tail -10 .logs/vulnerabilities.md

# View patterns
cat .logs/patterns.md

# Archive logs (daily)
mv .logs/hooks.md .logs/archive/hooks-[DATE].md
touch .logs/hooks.md
```

### Task Management

```bash
# View current plan
cat tasks/plan.md

# View task queue
cat tasks/todo.md

# View completed tasks
cat tasks/history.md
```

---

## 📊 METRICS & MONITORING

### System Health Checks

| Check | How | Target |
|-------|-----|--------|
| Test Pass Rate | `npm test` | 100% |
| Linting Pass Rate | `npm run lint` | 100% |
| Security Issues | `wc -l .logs/vulnerabilities.md` | 0 |
| Documentation Up-to-date | Compare timestamps | >90% |
| Task Completion Rate | completed / queued | >80% |
| Code Coverage | `npm run test:coverage` | >80% |

### Success Indicators

✅ Tests always passing  
✅ No lingering vulnerabilities  
✅ Documentation stays current  
✅ Tasks complete on time  
✅ Patterns identified and prevented  
✅ Team moving efficiently  

---

## 🔗 CROSS-REFERENCES

### File Dependencies

```
GLOBAL_RULES.md
  ← Used by: All other files
  → References: CONVENTIONS.md, DOCUMENTATION_PROTECTION.md

HOOKS_SYSTEM.md
  ← Used by: IDE configurations
  → References: GLOBAL_RULES.md, SCHEDULER_PROTOCOL.md

TRIPLE_PASS_PROTOCOL.md
  ← Used by: Every task planning
  → References: GLOBAL_RULES.md, MEMORY_STRUCTURE.md

MEMORY_STRUCTURE.md
  ← Used by: All logging operations
  → References: DOCUMENTATION_PROTECTION.md

SCHEDULER_PROTOCOL.md
  ← Used by: Every task execution
  → References: MEMORY_STRUCTURE.md, GLOBAL_RULES.md

DOCUMENTATION_PROTECTION.md
  ← Used by: Documentation updates
  → References: MEMORY_STRUCTURE.md, GLOBAL_RULES.md

Templates (README, MANIFEST, WIKI)
  ← Used by: Project-specific documentation
  → References: DOCUMENTATION_PROTECTION.md

IMPLEMENTATION_GUIDE.md
  ← Used by: Initial setup
  → References: All files
```

---

## 🚀 NEXT STEPS

### Immediate (Today)

1. **Read** this file completely (you're doing this)
2. **Skim** GLOBAL_RULES.md (understand scope)
3. **Skim** IMPLEMENTATION_GUIDE.md (understand setup)

### Short Term (This Week)

1. **Copy** IMPLEMENTATION_GUIDE.md steps to your project
2. **Create** all directories and files
3. **Customize** templates for your project
4. **Brief** your team on new workflows

### Medium Term (First Month)

1. **Run** first task through complete system
2. **Monitor** metrics (test pass rate, task completion)
3. **Update** CONVENTIONS.md with team patterns
4. **Expand** WIKI.md with technical details

### Long Term (Ongoing)

1. **Weekly** review patterns and update rules
2. **Monthly** consolidate learnings
3. **Quarterly** audit system health
4. **Yearly** major system updates

---

## 📞 QUICK HELP

### Common Questions

**Q: Where do I start?**  
A: Read IMPLEMENTATION_GUIDE.md and follow the steps.

**Q: What if something goes wrong?**  
A: Log to /.logs/errors.md and check IMPLEMENTATION_GUIDE.md troubleshooting.

**Q: Can I delete a documentation file?**  
A: No. Use ~~strikethrough~~ instead. See DOCUMENTATION_PROTECTION.md.

**Q: How long should a task take?**  
A: Max 30 min. If longer, split using SCHEDULER_PROTOCOL.md.

**Q: What if I can't complete a task?**  
A: Create TODO in /tasks/todo.md with full context. See SCHEDULER_PROTOCOL.md for format.

**Q: How do I handle errors?**  
A: Log to /.logs/errors.md immediately. See GLOBAL_RULES.md.

**Q: How do I verify my plan?**  
A: Use TRIPLE_PASS_PROTOCOL.md (all 3 passes required).

---

## 📦 WHAT'S INCLUDED

### System Files (Ready to Use)

✅ GLOBAL_RULES.md (6,000 words)  
✅ HOOKS_SYSTEM.md (5,000 words)  
✅ TRIPLE_PASS_PROTOCOL.md (6,000 words)  
✅ MEMORY_STRUCTURE.md (5,000 words)  
✅ SCHEDULER_PROTOCOL.md (5,000 words)  
✅ DOCUMENTATION_PROTECTION.md (4,000 words)  

### Templates (Customize for Your Project)

✅ README_TEMPLATE.md (2,000 words)  
✅ REPO_MANIFEST_TEMPLATE.md (2,000 words)  
✅ WIKI_TEMPLATE.md (3,000 words)  

### Guides (Step-by-Step)

✅ IMPLEMENTATION_GUIDE.md (4,000 words)  
✅ MASTER_INDEX.md (this file - 3,000 words)  

**Total:** 45,000 words of system documentation

---

## ✨ YOU'RE ALL SET!

You now have a complete, production-ready system for:

✅ **Coordinating** work across multiple IDEs  
✅ **Managing** agent execution with rules  
✅ **Tracking** tasks and progress  
✅ **Logging** errors and vulnerabilities  
✅ **Protecting** documentation  
✅ **Reviewing** work before execution  
✅ **Timing** tasks and managing tokens  
✅ **Learning** from patterns  

**Start with:** IMPLEMENTATION_GUIDE.md

**Questions?** Reference this index to find the right file.

---

## 🎯 SUCCESS DEFINITION

Your system is working when:

1. ✅ All tasks follow TRIPLE_PASS_PROTOCOL (3 passes)
2. ✅ All errors logged to /.logs/
3. ✅ All code changes pass tests + linting
4. ✅ All documentation updated with changes
5. ✅ All incomplete work in /tasks/todo.md
6. ✅ No documentation deleted (only deprecated)
7. ✅ All handoff TODOs clear and assigned
8. ✅ All agents following GLOBAL_RULES.md

When these are consistent, your system is healthy.

---

**Welcome to the Global Rules System v1.0**

🚀 Ready to get started? → IMPLEMENTATION_GUIDE.md

---

END OF MASTER INDEX
