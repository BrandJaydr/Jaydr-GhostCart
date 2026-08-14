# 🔍 TRIPLE PASS PROTOCOL v1.0

Three-pass review system for all planning and code generation work.

Every plan, every design, every implementation must pass all three gates.

---

## 🎯 CORE PRINCIPLE

**Before presenting work for approval or executing code:**

1. **PASS 1 (Understanding)** → Read and understand fully
2. **PASS 2 (Verification)** → Check logic, security, UX/UI, best practices
3. **PASS 3 (Completeness)** → Ensure nothing missed or misunderstood

---

## 📋 PASS 1: UNDERSTANDING & FORMULATION

**Goal:** Fully understand the task and create initial plan

**Actions:**

1. **Read the task 3 times**
   - First read: Get general understanding
   - Second read: Extract requirements and constraints
   - Third read: Identify ambiguities and edge cases

2. **Map all affected files**
   - List all files to be modified
   - List all files that might be impacted indirectly
   - Note dependencies between files

3. **Identify constraints**
   - Read /.logs/errors.md (recent)
   - Read /.logs/vulnerabilities.md (recent)
   - Read /.logs/patterns.md
   - Read CONVENTIONS.md
   - Read GLOBAL_RULES.md

4. **Extract acceptance criteria**
   - What must be true when complete?
   - What tests must pass?
   - What linting rules apply?
   - What security rules apply?

5. **Break into steps**
   - Create numbered step list
   - Estimate size of each step
   - Identify which steps have dependencies

6. **Formulate initial plan**
   - Write to /tasks/plan.md
   - Include: goal, steps, affected files, constraints, acceptance criteria
   - Flag any uncertainties

**Output:** Initial plan in /tasks/plan.md

**Status:** ⏳ Ready for PASS 2

---

## 🔐 PASS 2: VERIFICATION & HARDENING

**Goal:** Verify logic, check security, validate UX/UI, ensure best practices

**Actions:**

### 2.1 Logic Verification

1. **Step-by-step walkthrough**
   - Simulate each step mentally
   - Check if outputs of step N feed into step N+1 correctly
   - Identify logical gaps

2. **Edge case analysis**
   - What if input is empty?
   - What if input is null/undefined?
   - What if input is very large?
   - What if input is invalid format?
   - What if concurrent requests arrive?

3. **Dependency check**
   - Can steps run in order?
   - Are there circular dependencies?
   - Will each step have required context?

4. **Rollback feasibility**
   - If step 3 fails, can we rollback to step 2?
   - Will data be consistent?
   - Are there irreversible operations?

**Checkpoint:** Update /tasks/plan.md with refinements

### 2.2 Security Review

1. **Input validation**
   - Is all user input validated?
   - Are inputs sanitized?
   - Are type checks in place?

2. **Authorization checks**
   - Is permission verified?
   - Are rate limits checked?
   - Can users escalate privileges?

3. **Data protection**
   - Are secrets handled correctly?
   - Is sensitive data logged?
   - Is sensitive data exposed in errors?

4. **Common vulnerabilities**
   - SQL injection vectors?
   - XSS vulnerability?
   - CSRF vulnerability?
   - Unvalidated redirects?
   - Insecure deserialization?

5. **Dependencies**
   - Are all dependencies current?
   - Are there known vulns in dependencies?
   - Will this introduce new dependencies?

**Checkpoint:** If security concerns found → log to /.logs/vulnerabilities.md → escalate

### 2.3 Code Quality Review

1. **Architecture adherence**
   - Does plan follow existing patterns?
   - Is it consistent with CONVENTIONS.md?
   - Will it introduce technical debt?

2. **Performance considerations**
   - Will this be slow for large data?
   - Are there n+1 query patterns?
   - Are there unnecessary loops?

3. **Maintainability**
   - Will future developers understand this?
   - Are comments clear?
   - Are variable names descriptive?

4. **Testability**
   - Can this be tested?
   - Are dependencies mockable?
   - Are edge cases testable?

**Checkpoint:** Update plan with improvements

### 2.4 UX/UI Review (if applicable)

1. **User flow**
   - Is the flow logical?
   - Can users complete task without confusion?
   - Are error messages helpful?

2. **Accessibility**
   - Can screen readers use this?
   - Are colors accessible?
   - Is keyboard navigation supported?

3. **Consistency**
   - Does it match existing UI patterns?
   - Are spacing and typography consistent?
   - Are button states clear?

4. **Industry best practices**
   - Are we following web standards?
   - Are we following framework conventions?
   - Are we following accessibility guidelines (WCAG)?

**Checkpoint:** Update plan with UX improvements

### 2.5 Documentation Requirements

1. **README impact**
   - Will README need updating?
   - What version bump is needed?
   - What sections change?

2. **REPO_MANIFEST impact**
   - Does structure change?
   - Are new files added?
   - Does organization change?

3. **WIKI impact**
   - Is new technical detail needed?
   - Do existing explanations need updating?
   - Are there new configuration steps?

4. **Code comments**
   - Are complex sections commented?
   - Are WHY comments present (not just WHAT)?
   - Are TODO markers clear and assigned?

**Checkpoint:** Plan documentation updates

**Status:** ✅ Plan verified and hardened

---

## ✨ PASS 3: COMPLETENESS & CLARITY

**Goal:** Ensure nothing missed, nothing misunderstood, ready for approval

**Actions:**

### 3.1 Completeness Check

1. **Review against original requirements**
   - Does plan address every requirement?
   - Are all acceptance criteria covered?
   - Are edge cases addressed?

2. **Review affected areas**
   - Are all related files identified?
   - Are all dependencies addressed?
   - Are all implications considered?

3. **Review constraints**
   - Does plan respect GLOBAL_RULES.md?
   - Does plan respect CONVENTIONS.md?
   - Does plan respect security requirements?
   - Does plan respect performance requirements?

4. **Review testing**
   - Are all new code paths tested?
   - Are integration tests needed?
   - Are security tests needed?
   - Are performance tests needed?

5. **Review documentation**
   - Is README update planned?
   - Is REPO_MANIFEST update planned?
   - Is WIKI update planned?
   - Are code comments planned?

### 3.2 Clarity Check

1. **Step clarity**
   - Is each step actionable?
   - Could someone else execute this plan?
   - Are ambiguities resolved?

2. **File modification clarity**
   - What file is modified in each step?
   - What changed and why?
   - Are hunks atomic?

3. **Test clarity**
   - What tests need to pass?
   - How will success be verified?
   - What's the rollback plan if tests fail?

4. **Handoff clarity**
   - If another agent picks this up, can they continue?
   - Are all TODOs clear and assigned?
   - Is context documented?

### 3.3 Risk Assessment

1. **High-risk operations**
   - Are there irreversible changes?
   - Are there breaking changes?
   - Are there data migrations?

2. **Mitigation strategies**
   - Is there a rollback plan?
   - Is there a migration path?
   - Are there checkpoints?

3. **Approval requirements**
   - Does this need human approval before execution?
   - Are there security implications?
   - Are there breaking changes?

### 3.4 Final Verification

**Checklist before moving to execution:**

- [ ] All steps clearly defined
- [ ] All affected files identified
- [ ] All constraints reviewed
- [ ] Security review completed
- [ ] Code quality check passed
- [ ] UX/UI review passed (if applicable)
- [ ] Documentation updates planned
- [ ] Testing strategy clear
- [ ] Rollback plan exists
- [ ] Nothing missed or misunderstood

---

## 📝 TRIPLE PASS OUTPUT FORMAT

After all three passes, produce:

```markdown
# PLAN SUMMARY

## Task
[Original task description]

## Objective
[Clear objective statement]

## Affected Files
- [File 1] - [change description]
- [File 2] - [change description]

## Steps
1. [Step 1] - [affected files] - [estimated complexity]
2. [Step 2] - [affected files] - [estimated complexity]

## Security Review
- [Finding 1]
- [Finding 2]
[Conclusion: ✅ Safe to proceed OR ⚠️ Concerns flagged]

## Code Quality Review
- [Finding 1]
- [Finding 2]
[Conclusion: ✅ Follows patterns OR ⚠️ Improvements suggested]

## UX/UI Review (if applicable)
- [Finding 1]
[Conclusion: ✅ Follows standards OR ⚠️ Improvements needed]

## Testing Strategy
- Unit tests: [what's tested]
- Integration tests: [what's tested]
- Edge case tests: [what's tested]

## Documentation Updates
- README.md: [changes]
- REPO_MANIFEST.md: [changes]
- WIKI.md: [changes]
- Code comments: [additions]

## Risks & Mitigations
- Risk 1: [mitigation]
- Risk 2: [mitigation]

## Approval Status
☐ Ready for approval
☐ Ready for execution (low-risk)
☐ Waiting for clarification: [list items]
```

---

## 🎬 TRIPLE PASS TIMING

**Recommended time allocation:**

- **PASS 1:** 10-15% of planning time
- **PASS 2:** 60-70% of planning time (security, QA, best practices)
- **PASS 3:** 15-25% of planning time (completeness, clarity)

**Total:** Plan should be well-formed before code execution

---

## 🚨 WHEN TRIPLE PASS FAILS

If any pass identifies critical issues:

1. **Document findings**
   - Log to /tasks/plan.md
   - Mark as ⚠️ NEEDS REVISION

2. **Propose revisions**
   - Suggest specific changes
   - Explain why changes needed

3. **Wait for approval**
   - Don't proceed with flawed plan
   - Escalate if needed

4. **Update and re-pass**
   - Only re-execute PASS affected by changes
   - Full PASS 3 before execution

---

## 💡 TRIPLE PASS EXAMPLES

### Example 1: Adding a new endpoint

**PASS 1:** Understand request format, response format, auth requirements
**PASS 2:** Check SQL injection vectors, auth checks, rate limits, error handling, tests
**PASS 3:** Verify all path parameters validated, all response fields documented, all tests cover edge cases

### Example 2: Refactoring database schema

**PASS 1:** Understand current schema, migration path, backwards compatibility
**PASS 2:** Check data loss scenarios, migration performance, transaction safety, rollback capability
**PASS 3:** Verify all references updated, all tests updated, migration script tested

### Example 3: UI component redesign

**PASS 1:** Understand design requirements, accessibility requirements, responsive requirements
**PASS 2:** Check WCAG compliance, mobile usability, keyboard navigation, performance
**PASS 3:** Verify all states covered, all breakpoints tested, all feedback from designers integrated

---

## 🔗 INTEGRATION WITH OTHER SYSTEMS

**Triple Pass feeds into:**
- SCHEDULER_PROTOCOL (determines if task can proceed)
- HOOKS_SYSTEM (activates appropriate hooks)
- MEMORY_STRUCTURE (updates planning logs)

**Triggered by:**
- TASK_START hook
- APPROVAL_REQUESTED hook
- CLARIFICATION_NEEDED hook

---

END OF TRIPLE PASS PROTOCOL
