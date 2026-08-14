# 🎯 IMPLEMENTATION GUIDE v1.0

Complete setup instructions for deploying the global rules system across Cursor, Cline, Trae, and Windsurf.

---

## 📋 WHAT YOU NOW HAVE

### Core System Files

1. **GLOBAL_RULES.md** - Master constraints and policies
2. **HOOKS_SYSTEM.md** - Event triggers and agent activation
3. **TRIPLE_PASS_PROTOCOL.md** - Three-pass review system
4. **MEMORY_STRUCTURE.md** - File organization and logging
5. **SCHEDULER_PROTOCOL.md** - Task queuing and timing
6. **DOCUMENTATION_PROTECTION.md** - Doc preservation rules

### Template Files

7. **README_TEMPLATE.md** - Project overview template
8. **REPO_MANIFEST_TEMPLATE.md** - Project structure template
9. **WIKI_TEMPLATE.md** - Technical documentation template

### Plus your original systems:
- AOP-CORE v1 (Agent Orchestration Pipeline)
- SWE AGENT PROTOCOL v1 (Software Engineering Framework)

---

## 🚀 IMPLEMENTATION STEPS

### PHASE 1: REPOSITORY SETUP (5 min)

#### Step 1.1: Create root documentation files

In your project root, create:

```bash
# Copy templates and customize
cp README_TEMPLATE.md README.md
cp REPO_MANIFEST_TEMPLATE.md REPO_MANIFEST.md
cp WIKI_TEMPLATE.md WIKI.md
touch CONVENTIONS.md CHANGELOG.md
```

#### Step 1.2: Create directory structure

```bash
mkdir -p .logs tasks .docs

# Initialize log files
touch .logs/errors.md
touch .logs/vulnerabilities.md
touch .logs/patterns.md
touch .logs/hooks.md

# Initialize task files
touch tasks/plan.md
touch tasks/todo.md
touch tasks/history.md
```

#### Step 1.3: Create system rules files

```bash
# Copy all system files to project root
cp GLOBAL_RULES.md .
cp HOOKS_SYSTEM.md .
cp TRIPLE_PASS_PROTOCOL.md .
cp MEMORY_STRUCTURE.md .
cp SCHEDULER_PROTOCOL.md .
cp DOCUMENTATION_PROTECTION.md .

# Also include original frameworks
cp __AOP-CORE_v1_-_Agent_Orchestration___Pipeline_Core.md .
cp __SWE_AGENT_PROTOCOL_v1_-Rules_of_Engagements_for_A_I__Jaydr_Projects.md .
```

#### Step 1.4: Add to git

```bash
git add README.md REPO_MANIFEST.md WIKI.md
git add .logs/ tasks/
git add GLOBAL_RULES.md HOOKS_SYSTEM.md TRIPLE_PASS_PROTOCOL.md
git add MEMORY_STRUCTURE.md SCHEDULER_PROTOCOL.md DOCUMENTATION_PROTECTION.md
git commit -m "docs: initialize global rules system"
```

---

### PHASE 2: IDE CONFIGURATION (Per IDE)

Each IDE gets the same core, then IDE-specific tweaks.

#### FOR CURSOR

**Step 2.1: Create `.cursor/rules.md`**

```bash
mkdir -p .cursor
touch .cursor/rules.md
```

**Content of `.cursor/rules.md`:**

```markdown
# Cursor Agent Rules

## System Prompt Prefix

You are operating under the global rules system. Before any task:

1. Load GLOBAL_RULES.md
2. Load TRIPLE_PASS_PROTOCOL.md
3. Load HOOKS_SYSTEM.md
4. Load MEMORY_STRUCTURE.md
5. Load SCHEDULER_PROTOCOL.md

## Execution Flow

EVERY task follows:

1. READ context (always first)
2. EXECUTE TRIPLE_PASS_PROTOCOL (all 3 passes required)
3. CHECK against GLOBAL_RULES.md
4. EXECUTE work
5. UPDATE documentation (README, REPO_MANIFEST, WIKI)
6. LOG errors and vulnerabilities
7. UPDATE tasks/todo.md with incomplete work

## Critical Gates

ALWAYS STOP if:
- Tests fail
- Linting fails
- Security issues found
- Documentation deletion attempted

## Completion Checklist

Before closing task:
- [ ] Tests passing
- [ ] Linting passing
- [ ] Error log updated
- [ ] Vulnerability log updated
- [ ] TODO list updated
- [ ] README version bumped
- [ ] REPO_MANIFEST updated
- [ ] WIKI updated
- [ ] Handoff TODOs created
```

**Step 2.2: Create `.cursor/project-context.md`**

```bash
touch .cursor/project-context.md
```

Add your project-specific context, technology stack, and team information.

**Step 2.3: Enable Cursor settings**

In Cursor settings:
- Enable "Deep Research"
- Set context window to maximum
- Enable terminal access
- Enable file operations

---

#### FOR CLINE (in Cursor)

**Step 3.1: Create `.cline/rules.md`**

```bash
mkdir -p .cline
touch .cline/rules.md
```

Same content as Cursor rules but add:

```markdown
## Cline Specific

- Use @help command to reference this system
- Use @code to execute code blocks
- Use @browser for web search
- Always log to /.logs/ files
```

---

#### FOR TRAE

**Step 4.1: Create `.trae/config.json`**

```json
{
  "rules": {
    "system_prompt_files": [
      "GLOBAL_RULES.md",
      "TRIPLE_PASS_PROTOCOL.md",
      "HOOKS_SYSTEM.md"
    ],
    "max_execution_time": 1800,
    "token_limit": 128000,
    "auto_commit": false,
    "require_approval": true
  },
  "memory": {
    "context_files": [
      ".logs/errors.md",
      ".logs/patterns.md",
      ".logs/vulnerabilities.md",
      "tasks/plan.md",
      "CONVENTIONS.md"
    ]
  },
  "hooks": {
    "on_completion": "update_documentation",
    "on_error": "log_and_queue",
    "on_vulnerability": "block_and_escalate"
  }
}
```

---

#### FOR WINDSURF

**Step 5.1: Create `.windsurf/instructions.md`**

```bash
mkdir -p .windsurf
touch .windsurf/instructions.md
```

Content:

```markdown
# Windsurf Instructions

## Load System on Start

1. Read GLOBAL_RULES.md
2. Read TRIPLE_PASS_PROTOCOL.md
3. Check current task in tasks/plan.md
4. Check recent errors in .logs/errors.md

## Before Each Completion

- Verify tests pass
- Verify linting passes
- Update README.md version
- Update REPO_MANIFEST.md
- Update WIKI.md
- Create handoff TODOs

## Queue Incomplete Work

If task cannot complete:
1. Save state to tasks/todo.md
2. Create @agent handoff marker
3. Document context
4. Note blockers
```

---

### PHASE 3: INITIAL LOG SETUP (2 min)

Create starter log entries:

**`.logs/errors.md`**

```markdown
# Error Log

## System Initialization [DATE]

No errors yet. This log will track all errors encountered during development.

```

**`.logs/vulnerabilities.md`**

```markdown
# Vulnerability Log

## System Initialization [DATE]

No vulnerabilities yet. This log will track security issues during development.

```

**`.logs/patterns.md`**

```markdown
# Patterns & Learnings

## System Initialization [DATE]

No patterns identified yet. This log will track recurring issues and solutions.

```

**`tasks/plan.md`**

```markdown
# Task Plan

**Status:** Initialized

## Current Task
[To be filled in by agent when task assigned]

```

**`tasks/todo.md`**

```markdown
# Task Queue & Backlog

## INITIALIZATION TASKS

### [Project] - Initial Setup
**Status:** In Progress
**Priority:** High

- [ ] Initialize documentation
- [ ] Setup project structure
- [ ] Configure CI/CD
- [ ] Write initial tests

```

**`tasks/history.md`**

```markdown
# Completed Tasks Archive

## [DATE] - System Initialization

**Task:** Setup global rules system
**Status:** ✅ Complete

**Summary:**
- Initialized GLOBAL_RULES.md framework
- Created TRIPLE_PASS_PROTOCOL
- Established HOOKS_SYSTEM
- Setup MEMORY_STRUCTURE
- Configured SCHEDULER_PROTOCOL
- Protections for documentation

**Metrics:**
- Files created: 13
- Directories created: 3

```

---

### PHASE 4: TEAM COMMUNICATION (5 min)

#### Step 6.1: Create team briefing document

**`SYSTEM_BRIEFING.md`**

```markdown
# Global Rules System Briefing

## What Changed

We've implemented a comprehensive agent/IDE coordination system:

### For Developers

- **GLOBAL_RULES.md** - What agents can and cannot do
- **TRIPLE_PASS_PROTOCOL.md** - How plans are reviewed (3 passes)
- **MEMORY_STRUCTURE.md** - Where information lives
- **SCHEDULER_PROTOCOL.md** - How tasks are queued and timed

### For Teams Using Multiple IDEs

- Use shared tasks/todo.md for coordination
- Each IDE pulls latest before starting
- Each IDE pushes after completion
- Handoff via @agent markers

### New Workflows

**Before any task:**
1. Read GLOBAL_RULES.md
2. Read TRIPLE_PASS_PROTOCOL.md
3. Run three passes before execution

**After any task:**
1. Update README.md (version bump)
2. Update REPO_MANIFEST.md (if structure changed)
3. Update WIKI.md (if new tech details)
4. Log all errors and vulnerabilities
5. Update tasks/todo.md with remaining work

## Quick Reference

| Need | File |
|------|------|
| Learn what agents can do | GLOBAL_RULES.md |
| Plan a task | TRIPLE_PASS_PROTOCOL.md |
| Understand events | HOOKS_SYSTEM.md |
| Find information | MEMORY_STRUCTURE.md |
| Manage time | SCHEDULER_PROTOCOL.md |
| Protect docs | DOCUMENTATION_PROTECTION.md |

## Questions?

Refer to WIKI.md for technical depth or create an issue.

---

Generated: [DATE]
```

#### Step 6.2: Share with team

```bash
git add SYSTEM_BRIEFING.md
git commit -m "docs: add system briefing for team"
git push
```

---

## 🎯 VERIFICATION CHECKLIST

After setup, verify everything:

- [ ] All .md files created in root
- [ ] /.logs/ directory with 4 files
- [ ] /tasks/ directory with 3 files
- [ ] /.docs/ directory ready
- [ ] IDE-specific config created
- [ ] Git repo updated
- [ ] Team notified

---

## 📱 IDE QUICK REFERENCE

### CURSOR

Copy-paste this into any new chat:

```
I'm working within a structured global rules system. Before proceeding:

1. Reference GLOBAL_RULES.md for all constraints
2. Execute TRIPLE_PASS_PROTOCOL before planning
3. Use HOOKS_SYSTEM.md for event triggers
4. Update logs via MEMORY_STRUCTURE.md
5. Manage time with SCHEDULER_PROTOCOL.md

All code changes must pass:
- Tests
- Linting
- Security review
- Documentation updates

Log all errors to /.logs/errors.md
Log all vulnerabilities to /.logs/vulnerabilities.md
```

### CLINE

Use this in project context:

```
Load from root:
- GLOBAL_RULES.md
- TRIPLE_PASS_PROTOCOL.md  
- HOOKS_SYSTEM.md
- SCHEDULER_PROTOCOL.md

On completion:
- npm test (must pass)
- npm run lint:fix
- Update README.md version
- Update REPO_MANIFEST.md
- Create handoff TODOs in /tasks/todo.md
```

### TRAE

Add to system prompt:

```
Rules:
- GLOBAL_RULES.md governs all execution
- TRIPLE_PASS_PROTOCOL required for plans
- All errors logged to /.logs/
- All vulnerabilities block execution
- Documentation protected (no deletion)
```

### WINDSURF

Create custom instruction:

```
Load system:
GLOBAL_RULES.md + TRIPLE_PASS_PROTOCOL.md

Execution:
1. Understand (PASS 1)
2. Verify (PASS 2)  
3. Completeness (PASS 3)
4. Execute

Completion:
- Tests ✅
- Docs 📚
- Logs 📝
- Handoff ✋
```

---

## 🔄 ONGOING MAINTENANCE

### Daily

- Update `.logs/hooks.md` with execution log
- Archive session at end of day

### Weekly

- Review `.logs/patterns.md`
- Update CONVENTIONS.md if patterns found
- Review `.logs/vulnerabilities.md`
- Update security practices

### Monthly

- Archive logs to backup
- Update README version if needed
- Review REPO_MANIFEST completeness
- Update WIKI with learnings

### Quarterly

- Full system audit
- Update all version numbers
- Review and consolidate patterns
- Generate metrics report

---

## 📊 SUCCESS METRICS

Track these after setup:

| Metric | Target | How to Measure |
|--------|--------|-----------------|
| Test Pass Rate | 100% | `npm test` output |
| Linting Pass Rate | 100% | `npm run lint` output |
| Security Issues | 0 | `.logs/vulnerabilities.md` count |
| Documentation Freshness | >90% | Compare timestamps to code |
| Task Completion Rate | >80% | `tasks/history.md` vs `tasks/todo.md` |
| Code Coverage | >80% | `npm run test:coverage` |

---

## 🆘 TROUBLESHOOTING SETUP

### Issue: Can't find GLOBAL_RULES.md

**Solution:** Make sure all files are in project root:
```bash
ls -la *.md
```

### Issue: IDE not reading rules

**Solution:** Restart IDE and clear cache

### Issue: Tests failing after setup

**Solution:** Not related to setup. Follow error log to debug.

### Issue: Documentation file deleted

**Solution:** Recover from git:
```bash
git checkout HEAD -- [filename]
```

---

## 📞 GETTING HELP

### Questions about:

- **System architecture** → Read GLOBAL_RULES.md
- **Planning tasks** → Read TRIPLE_PASS_PROTOCOL.md
- **When agents act** → Read HOOKS_SYSTEM.md
- **Where files live** → Read MEMORY_STRUCTURE.md
- **Task timing** → Read SCHEDULER_PROTOCOL.md
- **Doc protection** → Read DOCUMENTATION_PROTECTION.md

### Still stuck?

1. Check WIKI.md troubleshooting section
2. Search .logs/errors.md for similar issues
3. Review tasks/history.md for solved problems
4. Create issue with full context

---

## ✅ NEXT STEPS

### Now that setup is complete:

1. **Customize CONVENTIONS.md** with your team's code style
2. **Fill in project details** in README.md, REPO_MANIFEST.md, WIKI.md
3. **Configure CI/CD** to run system checks
4. **Train team** on new workflows
5. **Start using** - assign first task and run through system

### First task should be:

```markdown
## Task: Complete Documentation Setup

**Description:**
Fill in all template files with project-specific details

**Acceptance Criteria:**
- README.md completed with real project info
- REPO_MANIFEST.md completed with structure
- WIKI.md completed with technical details
- CONVENTIONS.md completed with team standards
- All cross-links working
- Version numbers set

**Expected Duration:** 30-45 minutes
```

---

## 🎓 ADVANCED CONFIGURATION

### Adding Custom Hooks

Edit HOOKS_SYSTEM.md to add project-specific hooks:

```markdown
## CUSTOM HOOK: [Your Hook Name]

**Trigger:** [When this happens]
**Agent:** [Who handles it]
**Actions:**
- [Action 1]
- [Action 2]

**Status:** [Default status]
```

### Adding Custom Rules

Edit GLOBAL_RULES.md to add team-specific rules:

```markdown
## Team Rule: [Rule Name]

**Policy:** [What's the rule?]
**Why:** [Why does this exist?]
**Enforcement:** [How is it enforced?]

See: [Related file]
```

---

## 📚 COMPLETE FILE MANIFEST

### Core System (6 files)
- GLOBAL_RULES.md
- HOOKS_SYSTEM.md
- TRIPLE_PASS_PROTOCOL.md
- MEMORY_STRUCTURE.md
- SCHEDULER_PROTOCOL.md
- DOCUMENTATION_PROTECTION.md

### Templates (3 files)
- README_TEMPLATE.md → README.md
- REPO_MANIFEST_TEMPLATE.md → REPO_MANIFEST.md
- WIKI_TEMPLATE.md → WIKI.md

### Configuration (3 files)
- CONVENTIONS.md (team standards)
- CHANGELOG.md (version history)
- SYSTEM_BRIEFING.md (team communication)

### Directories (3)
- /.logs/ (errors, vulnerabilities, patterns, hooks)
- /tasks/ (plan, todo, history)
- /.docs/ (supporting documentation)

### IDE-Specific
- .cursor/rules.md (Cursor config)
- .cline/rules.md (Cline config)
- .trae/config.json (Trae config)
- .windsurf/instructions.md (Windsurf config)

**Total: 19 core files + IDE configs**

---

## 🚀 YOU'RE READY!

Your global rules system is now configured. Each IDE (Cursor, Cline, Trae, Windsurf) can:

✅ Read from shared rules  
✅ Execute TRIPLE_PASS_PROTOCOL  
✅ Track work in /tasks/  
✅ Log errors and vulnerabilities  
✅ Update documentation  
✅ Handoff incomplete work  

**Start your first task and watch the system work!**

---

END OF IMPLEMENTATION GUIDE
