# 💾 MEMORY STRUCTURE v1.0

Complete state, logging, and file organization system for all agents.

This defines:
- Where information is stored
- How it's accessed
- Append-only vs mutable files
- Retention policies
- Backup strategies

---

## 📁 DIRECTORY STRUCTURE

```
PROJECT_ROOT/
├── README.md                      [Auto-generated, v-tracked]
├── REPO_MANIFEST.md              [Structure inventory, v-tracked]
├── WIKI.md                        [Technical docs, v-tracked]
├── CONVENTIONS.md                 [Code style rules, v-tracked]
├── .gitignore
├── package.json
├── tsconfig.json
│
├── /.logs/                        [Append-only logs]
│   ├── errors.md                  [Error catalog]
│   ├── vulnerabilities.md         [Security issues]
│   ├── patterns.md                [Recurring patterns]
│   └── hooks.md                   [Hook execution log]
│
├── /tasks/                        [Task management]
│   ├── plan.md                    [Current task plan]
│   ├── todo.md                    [Queued tasks & incomplete work]
│   └── history.md                 [Completed tasks (archive)]
│
├── /.docs/                        [Supporting documentation]
│   ├── ARCHITECTURE.md
│   ├── API_REFERENCE.md
│   ├── SETUP.md
│   ├── DEPLOYMENT.md
│   └── [other docs]
│
├── /src/                          [Source code]
│
└── /tests/                        [Test files]
```

---

## 📝 FILE REFERENCE

### CORE FILES (Version-tracked)

#### README.md
**Purpose:** Project overview and getting started
**Version:** v[MAJOR].[MINOR].[PATCH]
**Mutable:** Yes (auto-generated)
**Update triggers:**
- Code completion with feature changes
- Version number updates
- Dependency changes
- New setup requirements

**Template:**
```markdown
# [Project Name]

v[VERSION]

## Overview
[What does this project do?]

## Quick Start
[How to get started]

## Features
[Key features with versions introduced]

## Documentation
- [REPO_MANIFEST.md](REPO_MANIFEST.md) - Project structure
- [WIKI.md](WIKI.md) - Technical documentation
- [/.docs/](.docs/) - Supporting docs

## Dependencies
- [List with versions]

## Getting Help
[Support information]
```

---

#### REPO_MANIFEST.md
**Purpose:** Inventory of project structure and components
**Version:** v[MAJOR].[MINOR].[PATCH]
**Mutable:** Yes (updated when structure changes)
**Update triggers:**
- New files added
- Files deleted
- Directory structure changes
- New modules or features

**Format:**
```markdown
# Repository Manifest

v[VERSION]

## Project Structure
[Tree or description of structure]

## Modules
| Module | Purpose | Files | Last Updated |
|--------|---------|-------|--------------|
| [Name] | [What] | [File list] | [Date] |

## Key Files
- [File]: [Purpose]

## Dependencies
[Dependency tree]

## Configuration Files
- [config file]: [Purpose]

## Build Artifacts
- [artifact]: [Purpose]
```

---

#### WIKI.md
**Purpose:** Technical documentation and explanations
**Version:** v[MAJOR].[MINOR].[PATCH]
**Mutable:** Yes (continuously expanded)
**Update triggers:**
- New technical patterns discovered
- New features with complexity
- Recurring questions answered
- Architecture decisions documented

**Format:**
```markdown
# Technical Wiki

v[VERSION]

## Table of Contents
1. [Core Concepts]
2. [Architecture]
3. [Configuration Guide]
4. [How-To Guides]
5. [Troubleshooting]
6. [Glossary]

## [Topic 1]
[Detailed explanation]

### Configuration
[How to configure]

### Examples
[Code examples]

---
## [Topic 2]
...
```

---

#### CONVENTIONS.md
**Purpose:** Code style, naming, and pattern rules
**Version:** v[MAJOR].[MINOR].[PATCH]
**Mutable:** Yes (updated when patterns refined)
**Update triggers:**
- New code style rule established
- New naming convention adopted
- New architectural pattern identified
- Bug pattern discovered and prevented

**Format:**
```markdown
# Code Conventions

v[VERSION]

## Naming
- [Convention 1]
- [Convention 2]

## File Structure
[How files should be organized]

## Code Style
[Linting rules, formatting]

## Patterns
- [Pattern 1]: [When to use]
- [Pattern 2]: [When to use]

## Security Patterns
- [Pattern 1]: [Prevention rule]

## Performance Patterns
- [Pattern 1]: [Best practice]

## Anti-Patterns
~~[Discouraged pattern]~~ - [Why]
```

---

### LOG FILES (Append-only)

#### /.logs/errors.md
**Purpose:** Catalog all errors encountered
**Mutable:** Append-only (never delete, only add)
**Retention:** Forever
**Update triggers:**
- Any error encountered
- Any critical failure
- Any recovery action needed

**Format:**
```markdown
# Error Log

## [DATE] - [TASK NAME]

**Error Type:** [Type]
**Severity:** [Critical|High|Medium|Low]
**File(s):** [Affected files]

**Error Message:**
[Exact error or description]

**Context:**
- Step: [What step failed?]
- Input: [What was being processed?]
- Expected: [What should happen?]
- Actual: [What happened instead?]

**Root Cause:**
[Analysis of why it failed]

**Fix Applied:**
[How it was resolved]

**Prevention:**
- [Check 1 for next time]
- [Check 2 for next time]

**Pattern Check:**
Similar to [error from X date]? Yes/No

**Agent:** [Who handled this]

---

## [EARLIER ENTRIES BELOW]
```

---

#### /.logs/vulnerabilities.md
**Purpose:** Catalog security issues and fixes
**Mutable:** Append-only (never delete)
**Retention:** Forever (reference for security reviews)
**Update triggers:**
- Security issue discovered
- Vulnerability assessment completed
- Security pattern identified

**Format:**
```markdown
# Vulnerability Log

## [DATE] - [TASK NAME]

**Vulnerability Type:** [SQL Injection|XSS|CSRF|Auth|Other]
**Severity:** [Critical|High|Medium|Low]
**CVSS Score:** [If applicable]

**Description:**
[What is vulnerable?]

**Location:**
- File: [Path]
- Line(s): [Line numbers]
- Component: [What part]

**Impact:**
[What could happen if exploited?]

**Proof of Concept:**
[How could it be exploited?]

**Fix Applied:**
[How it was fixed]

**Verification:**
- [Test 1]: [Passed/Failed]
- [Test 2]: [Passed/Failed]

**Prevention Rule:**
[Rule to prevent similar issues]

**Pattern Check:**
Matches [vulnerability pattern]? Yes/No

**Agent:** [Who handled this]

---

## [EARLIER ENTRIES BELOW]
```

---

#### /.logs/patterns.md
**Purpose:** Catalog recurring issues and solutions
**Mutable:** Append-only (evolving knowledge base)
**Retention:** Forever
**Update triggers:**
- Error appears 3rd time
- Vulnerability appears 2nd time
- Solution successfully reused
- New best practice identified

**Format:**
```markdown
# Patterns & Learnings

v[VERSION]

## [PATTERN NAME]

**Type:** [Error|Security|Performance|Architecture|Other]
**Severity:** [Critical|High|Medium|Low]
**Frequency:** [N occurrences]
**Last Seen:** [Date]

**Description:**
[What is this pattern?]

**Symptoms:**
- [Sign 1]
- [Sign 2]
- [Sign 3]

**Root Causes:**
1. [Cause 1]
2. [Cause 2]

**Prevention Checklist:**
- [ ] [Check 1]
- [ ] [Check 2]
- [ ] [Check 3]

**Occurrences:**
- [Date]: [Context]
- [Date]: [Context]
- [Date]: [Context]

**Solutions Tried:**
- [Solution 1]: [Result]
- [Solution 2]: [Result - SUCCESSFUL]

**Best Practice:**
[Recommended approach]

**Added to CONVENTIONS.md:** [Yes/No]
**Added to WIKI.md:** [Yes/No]
**Added to HOOKS_SYSTEM.md:** [Yes/No]

---

## [EARLIER PATTERNS BELOW]
```

---

#### /.logs/hooks.md
**Purpose:** Execution log of hook triggers
**Mutable:** Append-only
**Retention:** Current session (archive at end)
**Update triggers:**
- Hook triggered
- Hook completed
- Hook blocked or failed

**Format:**
```markdown
# Hook Execution Log

## [TIMESTAMP] - [HOOK_NAME]

**Status:** [Triggered|In-Progress|Complete|Failed|Blocked]
**Agent:** [Who handled it]
**Priority:** [Critical|High|Medium|Low]

**Details:**
- Trigger: [What caused it?]
- Action: [What did agent do?]
- Result: [What happened?]

**Output:**
[Any files modified or logs created]

**Next Steps:**
[What happens now?]

---
## [EARLIER HOOKS BELOW]
```

---

### TASK MANAGEMENT FILES

#### /tasks/plan.md
**Purpose:** Current task plan and strategy
**Mutable:** Yes (updated during planning)
**Retention:** Keep for current task, archive after completion
**Update triggers:**
- Task starts
- PASS 2 review adds refinements
- PASS 3 adds final polish
- Plan approved

**Format:**
```markdown
# Task Plan

**Date:** [YYYY-MM-DD]
**Status:** [Planning|Approved|In-Progress|Complete]
**Task ID:** [ID]

## Original Request
[Exact task description]

## Objective
[Clear, measurable objective]

## Constraints & Context
- [Constraint 1]
- [Context 1]

## Affected Files
| File | Change | Complexity |
|------|--------|------------|
| [Path] | [Description] | [Low/Med/High] |

## Execution Steps

### Step 1: [Name]
- Affected files: [List]
- Dependencies: [What must complete first?]
- Estimated complexity: [Low/Med/High]
- Security considerations: [List]
- Testing: [What to test]

### Step 2: [Name]
...

## Testing Strategy
- Unit tests: [Scope]
- Integration tests: [Scope]
- Edge cases: [List]

## Security Review Results
✅ Completed [Date]
- [Finding 1]
- Conclusion: [Safe/Concerns]

## Documentation Updates
- README.md: [Changes]
- REPO_MANIFEST.md: [Changes]
- WIKI.md: [Changes]

## Approval Status
Status: [Approved|Awaiting Review|Rejected|Needs Clarification]
```

---

#### /tasks/todo.md
**Purpose:** Queued tasks and incomplete work
**Mutable:** Yes (updated as tasks complete or new work discovered)
**Retention:** Keep until complete, then move to history.md
**Update triggers:**
- Task cannot complete in current session
- New work discovered during execution
- Token limit approaching
- Task too long for single session

**Format:**
```markdown
# Task Queue & Backlog

## HIGH PRIORITY

### [Task ID] - [Name]
**Status:** [Not Started|In Progress|Blocked]
**Assigned to:** [Agent or Next Session]
**Reason Queued:** [Why not completed?]
**Created:** [Date]
**Modified:** [Date]

**Description:**
[What needs to be done?]

**Context:**
[Previous work, state, dependencies]

**Handoff Information:**
[What the next agent needs to know]

```
@agent:[name] [specific action]
@status:[status]
@token-cost:[estimated]
```

**Next Steps:**
1. [Step 1]
2. [Step 2]

**Related Files:**
- [File 1]
- [File 2]

---

## MEDIUM PRIORITY
[Task list continues...]

## LOW PRIORITY
[Task list continues...]

## DEPENDENCIES
[If Task A blocks Task B, note here]

## METRICS
- Total tasks: [N]
- High priority: [N]
- Medium priority: [N]
- Low priority: [N]
- Total estimated tokens: [N]
```

---

#### /tasks/history.md
**Purpose:** Archive of completed tasks
**Mutable:** Append-only (add completed tasks)
**Retention:** Forever (reference for patterns)

**Format:**
```markdown
# Completed Tasks Archive

## [DATE] - [Task Name]

**Task ID:** [ID]
**Duration:** [Session count]
**Status:** ✅ Complete

**Summary:**
[Brief summary of what was done]

**Changes Made:**
- [File 1]: [Change description]
- [File 2]: [Change description]

**Metrics:**
- Lines added: [N]
- Lines removed: [N]
- Files modified: [N]
- Tests added: [N]
- Errors encountered: [N]
- Security issues: [N]

**Lessons Learned:**
- [Learning 1]
- [Learning 2]

**Related Patterns:**
- [Pattern name]: [How it applies]

**Agent(s):** [Who worked on it]

---
## [EARLIER TASKS BELOW]
```

---

### SUPPORTING DOCUMENTATION

#### /.docs/ directory

Optional supporting documents:

```
/.docs/
├── ARCHITECTURE.md           [System design]
├── API_REFERENCE.md          [API documentation]
├── SETUP.md                  [Installation & setup]
├── DEPLOYMENT.md             [Production deployment]
├── TROUBLESHOOTING.md        [Common issues]
├── SECURITY.md               [Security guidelines]
├── PERFORMANCE.md            [Performance tips]
└── [CUSTOM DOCS]             [Project-specific]
```

All docs are version-tracked and protected from deletion.

---

## 🔄 LOG ROTATION & ARCHIVAL

### Daily

At end of session:

```bash
# Archive hook log
mv /.logs/hooks.md /.logs/archive/hooks-[DATE].md
touch /.logs/hooks.md
```

### Monthly

At end of month:

```bash
# Archive completed tasks
mv /tasks/history.md /archive/tasks-[MONTH].md
touch /tasks/history.md
```

### Quarterly

At end of quarter:

```bash
# Archive patterns (backup only)
cp /.logs/patterns.md /archive/patterns-q[Q][YEAR].md
# Keep patterns.md current
```

---

## 🔒 MEMORY ACCESS PATTERNS

### Read before action:
1. Read /tasks/plan.md (current plan)
2. Read /.logs/errors.md (recent 10 entries)
3. Read /.logs/vulnerabilities.md (recent 5 entries)
4. Read /.logs/patterns.md (matching patterns)
5. Read CONVENTIONS.md

### Write on completion:
1. Update /tasks/plan.md (mark complete)
2. Update README.md (version + summary)
3. Update REPO_MANIFEST.md (if structure changed)
4. Update WIKI.md (if new technical details)
5. Create entries in /.logs/errors.md (if errors)
6. Create entries in /.logs/vulnerabilities.md (if security issues)
7. Update /.logs/patterns.md (if pattern matched)

### Write on failure:
1. Add entry to /.logs/errors.md immediately
2. Create TODO in /tasks/todo.md with context
3. Include @agent handoff marker

---

## 💾 BACKUP & RECOVERY

### What to backup:
- /.logs/ (all logs)
- /tasks/ (all tasks)
- /src/ (source code)
- /tests/ (test code)
- All version-tracked documentation

### What NOT to backup:
- node_modules/
- dist/
- .env files (never commit)
- IDE config (.idea/, .vscode/)

### Backup frequency:
- After every task completion
- Before major refactoring
- On error (preserve state)

---

## 🧠 MEMORY CONSTRAINTS

### Token usage:
- Max context per session: [IDE specific]
- When approaching limit:
  - Create TODO in /tasks/todo.md
  - Include full context for next session
  - Log to /.logs/hooks.md

### File size:
- Keep error log < 50KB per month
- Keep patterns log < 100KB
- Archive large logs quarterly

---

END OF MEMORY STRUCTURE
