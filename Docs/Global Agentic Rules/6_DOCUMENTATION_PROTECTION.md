# 🛡️ DOCUMENTATION PROTECTION v1.0

Rules and guidelines for protecting, maintaining, and evolving documentation.

This defines:
- What documentation cannot be deleted
- How to handle outdated information
- How to track documentation changes
- Approval workflows for documentation
- Documentation lifecycle

---

## 📚 PROTECTED DOCUMENTATION

### TIER 1: CRITICAL (Never Delete)

These files are immutable except through explicit approval:

```
README.md                    [Project overview]
REPO_MANIFEST.md            [Project structure]
WIKI.md                      [Technical documentation]
CONVENTIONS.md               [Code style & patterns]
/.logs/errors.md            [Error catalog]
/.logs/vulnerabilities.md   [Security issues]
/.logs/patterns.md          [Recurring patterns]
/.docs/ARCHITECTURE.md      [System design]
/.docs/SECURITY.md          [Security guidelines]
```

**Deletion rule:** ❌ **CANNOT DELETE** - Mark content as deprecated instead

**Modification rule:** ✅ **Can modify** - Update through auto-generation or human review

**Approval rule:** 🔒 If critical changes needed, require explicit approval

---

### TIER 2: IMPORTANT (Version Tracked)

These files are tracked and have version history:

```
/tasks/plan.md              [Current task plan]
/tasks/history.md           [Completed tasks archive]
/.logs/hooks.md             [Hook execution log]
/.docs/[other files]        [Supporting documentation]
```

**Deletion rule:** ❌ **CANNOT DELETE** - Archive instead

**Modification rule:** ✅ **Can modify** - Track versions

**Approval rule:** 📋 Track what changed and why

---

### TIER 3: MUTABLE (Session Temporary)

These files are temporary and can be cleared after archival:

```
/tasks/todo.md              [Current task queue]
/.logs/hooks.md             [Current session hooks]
```

**Deletion rule:** ✅ **Can clear** - But only after archival
**Modification rule:** ✅ **Freely modify** - For current session
**Approval rule:** ⏸️ Archive daily before clearing

---

## ~~STRIKETHROUGH PROTOCOL~~ (Mark, Don't Delete)

When documentation becomes outdated or irrelevant:

### RULE: Always use strikethrough, never delete

#### BAD ❌
```markdown
# Old Feature
[Content deleted]
```

#### GOOD ✅
```markdown
# ~~Old Feature~~ (Deprecated 2024-04-19)

~~This feature is no longer supported.~~

**Replaced by:** [New Feature Link]
**Migration guide:** [Link to migration docs]
```

---

## 📝 DEPRECATION PROCESS

### Step 1: Mark with strikethrough
```markdown
~~Content that is outdated or removed~~
```

### Step 2: Add deprecation note
```markdown
~~Feature name~~ (Deprecated YYYY-MM-DD)

**Reason:** [Why is this deprecated?]
**Replacement:** [What should be used instead?]
**Migration:** [How to migrate?]
**Timeline:** [When will this be removed?]
```

### Step 3: Add to DEPRECATED section
```markdown
## DEPRECATED

### [Feature Name]
~~[Old description]~~

Deprecated: [Date]
Reason: [Why]
Replacement: [Link to replacement]
```

### Step 4: Leave there forever
- Keep deprecated section in documentation
- Can move to end of file
- Can hide under collapsed section (HTML)
- Never truly delete

---

## 🔐 DELETION GUARDS

### What happens if you try to delete protected docs:

1. **Git hook prevents deletion**
   ```
   ERROR: Cannot delete protected file: README.md
   Use git mv to move it, or add @deprecated markers
   ```

2. **Pre-commit check**
   ```
   Pre-commit check: README.md deleted
   ERROR: Protected file cannot be deleted
   Suggestion: Use ~~strikethrough~~ in content instead
   ```

3. **Manual review required**
   If genuinely need to delete:
   ```
   Create issue: REQUEST: Delete [filename]
   Reason: [Why completely delete?]
   Approval: [Who approves?]
   ```

---

## 📋 DOCUMENTATION CHANGE TRACKING

### Every documentation change must include:

1. **What changed**
   ```markdown
   - Updated: [Section name]
   - Added: [New content]
   - Deprecated: [Old content with ~~strikethrough~~]
   ```

2. **Why it changed**
   ```markdown
   Reason: [Explain the change]
   Related Task: [Task ID or description]
   Date: [YYYY-MM-DD]
   ```

3. **Who changed it**
   ```markdown
   Updated by: [Agent or human name]
   Approved by: [Who approved? If needed]
   ```

4. **Version number**
   ```markdown
   README.md v2.3.1 → v2.4.0
   WIKI.md v1.5.3 → v1.5.4
   ```

### Example change in README.md:

```markdown
# Change Log

## 2024-04-19

**Updated:** Installation section
- Added: Node.js 20+ requirement (was 18+)
- Reason: v2.4.0 requires new async features
- Agent: Scribe
- Related: Task #123

## 2024-04-15

**Deprecated:** ~~Legacy authentication method~~
- ~~Old instructions for API keys~~
- New: Use OAuth2 instead (link to WIKI.md)
- Timeline: Will be removed 2024-07-19
- Agent: Red Ranger
```

---

## 🔄 AUTO-GENERATED DOCUMENTATION

### Files that auto-update (don't manually edit):

```
README.md (version-based)
├─ Version: Auto-incremented
├─ Updated: On code completion
├─ Source: CHANGELOG or commit history
├─ Template: README_TEMPLATE.md

REPO_MANIFEST.md (structure-based)
├─ Updated: When files added/removed
├─ Source: Directory scan
├─ Template: REPO_MANIFEST_TEMPLATE.md
```

### Manual edits to auto-generated files:

If you need to add info to auto-generated docs:

1. **Add to template file**
   - Edit README_TEMPLATE.md
   - Edit REPO_MANIFEST_TEMPLATE.md

2. **Mark as manual section**
   ```markdown
   ## Manual Section: [Name]
   [Content that won't be overwritten]
   
   ## Auto-Generated Section: Starts Below
   [This section regenerates on build]
   ```

3. **Never manually edit auto-generated sections**

---

## 📖 DOCUMENTATION LIFECYCLE

### Phase 1: CREATION

New documentation:
1. Create .md file
2. Add to VERSION tracking
3. Add change log entry
4. Add to documentation index

```markdown
## [DATE] - New Documentation

**File:** [Filename]
**Purpose:** [What does it document?]
**Created by:** [Agent/Human]
**Reason:** [Why was this created?]
```

### Phase 2: EVOLUTION

Documentation updates:
1. Modify content (auto-generation or manual)
2. Increment version number
3. Add change log entry
4. Track what changed

```markdown
## [DATE] - Updated [Filename]

**Changes:**
- Added: [What was added?]
- Updated: [What changed?]
- Removed: ~~[What was removed with strikethrough]~~

**Reason:** [Why?]
**Agent:** [Who?]
```

### Phase 3: MAINTENANCE

Keep documentation current:
1. Review quarterly
2. Update outdated information
3. Archive history
4. Remove broken links

---

## 🔍 DOCUMENTATION AUDIT CHECKLIST

Every documentation file should pass:

- [ ] Version number current
- [ ] Change log entries present
- [ ] No content actually deleted (only deprecated)
- [ ] ~~Deprecated content~~ clearly marked
- [ ] External links functional
- [ ] Code examples tested
- [ ] Consistent formatting
- [ ] Readable and clear
- [ ] Up-to-date with code
- [ ] No credentials or secrets
- [ ] Tone consistent
- [ ] Accessibility guidelines met

---

## 📚 DOCUMENTATION HIERARCHY

### Level 1: Entry Points (Not Protected)
```
.github/
├── README.md              [Quick overview]
├── Getting Started Guide  [Setup instructions]
```

### Level 2: Core Docs (Protected - Tier 1)
```
README.md                 [Full project overview]
REPO_MANIFEST.md          [Project structure]
WIKI.md                   [Technical deep dives]
CONVENTIONS.md            [Code style & patterns]
```

### Level 3: Supporting Docs (Protected - Tier 2)
```
/.docs/
├── ARCHITECTURE.md       [System design]
├── API_REFERENCE.md      [API documentation]
├── SETUP.md              [Detailed setup]
├── DEPLOYMENT.md         [Deployment guide]
├── SECURITY.md           [Security guidelines]
├── TROUBLESHOOTING.md    [Common issues]
```

### Level 4: Logs (Protected - Tier 1)
```
/.logs/
├── errors.md             [Error catalog]
├── vulnerabilities.md    [Security issues]
├── patterns.md           [Recurring patterns]
```

### Level 5: Task Tracking (Protected - Tier 2)
```
/tasks/
├── plan.md               [Current plan]
├── todo.md               [Task queue]
├── history.md            [Completed tasks]
```

---

## 🚫 FORBIDDEN ACTIONS

### NEVER:
- ❌ Delete documentation files
- ❌ Delete change log entries
- ❌ Edit auto-generated content manually
- ❌ Ignore documentation updates when code changes
- ❌ Add credentials to documentation
- ❌ Include unverified claims
- ❌ Use outdated examples

### ALWAYS:
- ✅ Use ~~strikethrough~~ for deprecations
- ✅ Add change log entries
- ✅ Update version numbers
- ✅ Keep documentation synced with code
- ✅ Test code examples
- ✅ Link related documentation
- ✅ Mark deprecated content with dates

---

## 🔗 DOCUMENTATION LINKING

### Cross-reference pattern:

```markdown
For more information, see:
- [Feature Guide](WIKI.md#feature-guide)
- [API Reference](/.docs/API_REFERENCE.md)
- [Setup Instructions](/.docs/SETUP.md)
```

### Broken link detection:

Use CI/CD check:
```yaml
- name: Check documentation links
  run: |
    markdown-link-check README.md
    markdown-link-check WIKI.md
    markdown-link-check REPO_MANIFEST.md
```

---

## 🎓 DOCUMENTATION TEMPLATES

### README_TEMPLATE.md
See: /mnt/user-data/outputs/6_README_TEMPLATE.md

### REPO_MANIFEST_TEMPLATE.md
See: /mnt/user-data/outputs/7_REPO_MANIFEST_TEMPLATE.md

### WIKI_TEMPLATE.md
See: /mnt/user-data/outputs/8_WIKI_TEMPLATE.md

---

## 🔐 APPROVAL WORKFLOW

### For critical documentation changes:

1. **Agent makes change**
   - Updates documentation
   - Creates change log entry
   - Bumps version

2. **Change is logged**
   - Added to change tracking
   - Linked to related task
   - Flagged if critical

3. **Review (if needed)**
   - Complex changes need review
   - Security changes need approval
   - Architecture changes need approval

4. **Approval**
   - Change confirmed
   - Documentation updated
   - Change log committed

---

END OF DOCUMENTATION PROTECTION
