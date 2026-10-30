# TODO List - Jaydr GhostCart

> **Source of truth for delivery sequencing:** [Production Blueprint and Delivery Guide](../Docs/Production%20Blueprint%20and%20Delivery%20Guide.md)  
> **Thin vertical slice (first release):** A signed-in merchant imports an approved supplier product, reviews normalized data and pricing, generates an editable listing draft, and exports or submits that draft through **one** approved marketplace path.

---

## Changelog

### 2026-10-29 — Pattern Hunting & System Insights Update (LANE-5 / Minion 3)

**Category:** Pattern Hunting / System Insights

**Summary:** Completed standing Scout/Pattern Hunting duties (§6) under POOL-PICK designation. Analyzed recent error register entries in `.logs/errors.md` (ERR-049, ERR-050, ERR-053, ERR-054) and documented 2 new system patterns in `.logs/patterns.md`:
- Pattern 22: Stale-Branch Document Merge Overwrite (ERR-049, ERR-050, ERR-053).
- Pattern 23: ON CONFLICT ID Lookup Anti-Pattern (ERR-054).

### 2026-10-29 — Sweep #25 (Lead review): PR #31 accepted as a report, PR #32 review recorded, ERR-053 closed, ERR-054 logged

**Category:** Project governance / Lead review

**Summary:** Lead review sweep #25 (~7:32 PM ET). No new master commits since sweep #24 (head 13f397e0). PR #31 (LANE-4, standing security rotation + ERR-042 reconciliation) is ACCEPTED as a report-only pass, effective at merge; claim ratified; single commit on current master, paperwork-only diff verified file by file (board/todo/error-log). PR #32 (LANE-6, Job 1 draft: tenant-scoped API auth + fail-closed queue errors) — Lead REVIEW completed ~6:20 PM ET, recorded on the board by this sweep; accepted in substance as a draft; merge gated on execution evidence (tests/lint/typecheck/build — none ever executed; automated-check workflow itself broken, Job 3) + owner word + paperwork refresh if PR #31 lands first. Follow-up defect logged as ERR-054 (listing-draft conflict path crashes instead of returning the existing draft). ERR-053 CLOSED (one full cycle, zero paperwork-conflict merge failures). Designations: LANE-1 GC-202 (ungated — GC-201 merged, GC-102 decided); LANE-2 GC-302-FU1; LANE-3 test support as designated (ERR-047 closed); LANE-4 standing rotation continues; LANE-5 POOL-PICK; LANE-6 branch stays open, no new implementation authorized pending owner decision on Jobs 1/2/3 + CI repair; Oracle GC-R1 open for Claude. Merge warning: this push makes PR #31/#32 paperwork copies stale — refresh immediately before merging. No merges in this sweep.


### 2026-10-29 — Cleanup (Lead): dead branches closed, lanes re-pointed, coordination model + GC-102 decision recorded

**Category:** Project governance / Lead cleanup (no ticket parts — ticket-outbox proposal not adopted)

**Summary:** Closed PR #19 (superseded), #21 (superseded by #26), #22 (superseded by #27), #28 (verified regressive). Verified merges #23/#24/#25/#27 on master (head 103bcc5f); zero open proposals. §5 designations refreshed with compiled lessons (ERR-052 findings into GC-302-FU1; #28 regression finding into LANE-5). Coordination model written into §5.1 (workers never write to master; Lead coordinates; worker-fixes-branch preferred; close-and-recompile). ERR-053 added to the error register. GC-102 DECIDED: Option 2 (hybrid AES-256-GCM).

### 2026-10-29 — Sweep #22 (Lead review): PR #26 and PR #27 accepted, Codex PR #24 review ratified

**Category:** Project governance / Lead review

**Summary:** Lead review sweep #22 (~1:32 AM ET). Two new open pull requests since sweep #21, both based on current master head 22312670 (no new master commits). PR #26 (LANE-5 / Minion 3) re-delivers Pattern 22 ("Stale-Branch Document Merge Overwrite") in `.logs/patterns.md` on a fresh branch — ACCEPTED on review, effective at merge; §5.1 claim ratified, DONE at merge; supersedes PR #21 (do not merge as-is). PR #27 (LANE-1 / Jules) re-delivers the GC-101 env-sync fix-up — all 9 ERR-045 script variables added to `.env.example` with values matching the script defaults on master (verified script by script) — ACCEPTED on review, effective at merge; ERR-045 closes when PR #27 merges; GC-R1 still outstanding; supersedes PR #22 (do not merge). Codex's directed second-eyes review of PR #24 (commit 22312670, board-only) is ratified on sweep #19's file-level verification (PR #24 unchanged since). Designations: LANE-1 GC-201; LANE-2 rebase PR #23 then GC-302-FU1 (ERR-052, gated on PR #23 merging); LANE-3 rebase PR #24 then ERR-047 signer remainder (gated on GC-201, build work still BLOCKED); LANE-4 rebase PR #25 then standing security rotation; LANE-5 POOL-PICK. No merges in this sweep.


### 2026-10-28 — Sweep #21 (Lead review): Codex PR #23 review ratified (ERR-052), rebase fix-ups designated, LANE-3 blocked

**Summary:** Out-of-schedule Lead review sweep #21 (~9:32 PM ET) at the owner's request so Codex can run again. Codex (LANE-3 / Minion 1) committed a [CHECK-IN] + [REVIEW] to master (commit aa75f383, board-only, verified): directed second-eyes review of PR #23 / GC-302 found (a) no enqueue-through-queue test — new issue, (b) no enqueue site — `POST /api/ebay/submit` submits synchronously and never touches `listingQueue` — new issue, (c) `db:migrate` duplicate confirmed. The Lead re-verified all three against the actual branch/master files (test file: zero `.add(` calls, four direct processor calls; submit route: zero queue mentions; `package.json`: two `db:migrate` keys; worker registered on `listing.submit`, queue name matches). Findings ratified; new follow-up job GC-302-FU1 designated to LANE-2 (enqueue path + queue-to-worker test, gated on PR #23 merging, ERR-052) — GC-302 is not done until FU1 merges. No new pull requests since sweep #20; PRs #19/#21–#25 still open. All four merge attempts on the owner's word (~8:35 PM ET) failed safely on 405 conflicts — branches carry stale board/todo/error-log copies; each lane is designated to rebase onto current master keeping the code payload and dropping stale paperwork copies (no hand-resolving doc-file conflicts). LANE-3 build work is BLOCKED (ERR-047 signer remainder gated on GC-201); Codex's next run is designated as a directed review of PR #24 (review-only). No merges in this sweep. Master head at sweep start: aa75f383.


### 2026-10-28 — Sweep #20 (Lead review): PR #25 accepted, LANE-4 rotation pass

**Summary:** Lead review sweep #20 (~7:32 PM ET). One new builder output since sweep #19: PR #25 (LANE-4 / Minion 2) — §6 standing security rotation pass with a single dependency-upgrade proposal (vitest 2.0.3 → 2.1.9, GHSA-9crc-q9x8-hgqq verified patched in 2.1.9). Verdict: ACCEPTED on review, effective at merge; claim ratified. Open question carried forward: reported `npm audit` total 81 (54 low) does not reconcile with ERR-042's 27 (1 low) — next rotation must state its audit command/flags and reconcile. No new merges on master (head 98543600). LANE-1/2/3/5 designations unchanged; PRs #21–#24 still unmerged and awaiting the owner's word.


### 2026-10-28 — Sweep #19 (Lead review): PR #24 accepted (scheduler part of ERR-047), PR #23 accepted on re-review (ERR-051 corrected/closed), sweep #17/#18 verdicts landed

**Category:** Project governance / Lead review

**Summary:** One new open pull request since sweep #18, one owner merge during this sweep (PR #20, 2:08 PM ET, verified clean — head now 71e93930). PR #24 (LANE-3, PR #19 fix-up) is ACCEPTED on review, effective at merge: the scheduler test now asserts queue identity against the real production routing (refresh queue, verified on master), the duplicate `db:migrate` key removal and lint fixes verify clean, and the branch paperwork diff is clean — the scheduler/queue-identity part of ERR-047 is done at merge; the signer-test part stays open, gated on GC-201 (no signer module on master yet), and PR #19 must not merge as-is (PR #24 supersedes its scheduler/lint changes). PR #23 (LANE-2, GC-302) is ACCEPTED on re-review: ERR-051 is corrected and closed — master `package.json` carries `db:migrate` twice and the branch removes only the duplicate key, so the command survives (runner changes to `tsx`, a declared dependency); the worker code re-verified clean. No [CLAIM] was posted for PR #24 (designated work); PR #23's claim stands ratified. This push also lands sweep #17's and sweep #18's board/to-do/register updates, which never reached master. Designations: LANE-1 GC-201, LANE-2 GC-303 (gated on GC-202) with standing duties meanwhile, LANE-3 ERR-047 signer remainder (gated on GC-201), LANE-4 security rotation continues, LANE-5 POOL-PICK. PR #20 merged by the owner during this sweep and verified clean (paperwork-only, no wipe); its board/todo entries are preserved in this update. Merge-time warning for PRs #21/#22/#23/#24 (Pattern 22): reconcile board/todo/error-log copies against master at merge so sweep entries are not wiped.

### 2026-10-27 — §6 Standing Security Maintenance Pass (LANE-4 / Minion 2)

**Category:** Security & Compliance / RANGER + Dependency Guardian

**Summary:** Completed standing security rotation (§6) under LANE-4 designation on master.
- **Secrets Scan:** Scanned `src/` and `scripts/` using regex and grep; confirmed zero hardcoded keys, tokens, or plaintext credentials committed in version control.
- **Dependency Audit:** Re-ran `npm audit`, identifying 27 vulnerabilities (4 critical, 15 high, 7 moderate, 1 low) in external packages (Next.js, Tinypool, PostCSS, Playwright, Zod, glob, minimatch, source-map-js, uuid).
- **Auth & Tenancy:** Re-confirmed API route authorization posture (ERR-016 status unchanged).
- **Coordination:** Appended `[CHECK-IN]`, `[CLAIM]`, and `[DONE]` entries to `Docs/agent-job-board.md` Message Board and updated table state.

### 2026-10-28 — Sweep #18 (Lead review): PR #21/#22 accepted, PR #23 fixes needed (ERR-051), sweep #17 verdicts carried forward

**Category:** Project governance / Lead review

**Summary:** Three new open pull requests since sweep #17, no new master commits (head still 18c081d). PR #22 (LANE-1, GC-101 fix-up) is ACCEPTED on review, effective at merge: all 9 ERR-045 script variables are present in `.env.example` with values verified against the script defaults on master; ERR-045 closes when it merges; GC-R1 still outstanding; no [CLAIM] was posted (designated work). PR #21 (LANE-5, Pattern 22) is ACCEPTED on review, effective at merge; its §6 standing-duties claim is ratified. PR #23 (LANE-2, GC-302 listing.submit worker) is FIXES NEEDED (ERR-051): the processor, failure/DLQ handling, queue registration, and tests verify against the real queue, eBay client/mapper, and schema, but the branch deletes the `db:migrate` script line from `package.json` — restore it, then re-review; DONE overridden; claim ratified. PR #20 (LANE-4 rotation pass, ACCEPTED as a report) and PR #19 (LANE-3, still FIXES NEEDED, ERR-047, rebase target 18c081d) are unchanged; sweep #17's board/todo/register update never landed, so its STATUS/REVIEW entries and ERR-042/ERR-047 updates are carried forward in this push. ERR-049/ERR-050 closed as verified-restored on master. GC-302 stays unchecked until the PR #23 fix-up is accepted. Designations: LANE-1 GC-201, LANE-2 PR #23 fix-up, LANE-3 PR #19 fix-up, LANE-4 security rotation continues, LANE-5 POOL-PICK. Merge-time warning for PRs #21/#22/#23 (Pattern 22): reconcile board/todo/error-log copies against master at merge so sweep entries are not wiped.

### 2026-10-27 — Sweep #17 (Lead review): PR #20 rotation pass accepted as a report; PR #19 still fixes-needed; no other new builder output

**Category:** Project governance / Lead review

**Summary:** One new open pull request since sweep #16 (master head still 18c081d): PR #20 (LANE-4, standing security rotation) is ACCEPTED as a report-only pass — branch verified by file diff as paperwork-only (board + todo), cleanly based on current master, reporting zero hard-coded secrets, 27 dependency vulnerabilities (down from ERR-042's 28, same families), and ERR-016 unchanged; claim ratified; not merged (merges need the owner's word per PR). No upgrade proposal was attached — LANE-4's next rotation must propose one upgrade at a time with test evidence. PR #19 (LANE-3) re-checked: its 18:30 UTC merge-sync merged pre-restoration master, so the branch still lacks sweep #16 entries and ERR-045–ERR-050; merging it would wipe the paperwork a third time — still FIXES NEEDED (ERR-047), rebase target now 18c081d. LANE-1 (GC-201), LANE-2 (GC-302), and LANE-5 produced nothing new. Designations: LANE-1 GC-201 (+ ERR-045 remainder), LANE-2 GC-302, LANE-3 PR #19 fix-up, LANE-4 security rotation continues, LANE-5 POOL-PICK. ERR-042 and ERR-047 updated with this sweep's findings; no new ERR number issued.

### 2026-10-27 — Sweep #16 (Lead review): PRs #14–#17 merged by owner; closures verified, board/todo/register wipe restored, ERR-045–ERR-050 land

**Category:** Project governance / Lead review

**Summary:** Owner merged PR #14 (GC-301 fix-up), #15 (GC-S1 fix-up), #16 (Pattern Hunting), and #17 (GC-101 re-do) during the sweep; PRs #18/#19 still open, unchanged. Verified on master: the refresh-queue export + cron-parser declaration (ERR-040/041 CLOSED), the fail-closed database throw + credential-less fallback (ERR-043 CLOSED, ERR-044 CLOSED), Patterns 19–21 (PR #16), the 4 database-script variables from PR #17 (ERR-045 stays OPEN — 9 variables still missing, now a master fix-up for LANE-1), and the removal of the unused webhook variable (ERR-048 CLOSED by the #15 merge). The merges wiped the error register back to ERR-044 and the board back past sweep #13 (ERR-049/ERR-050); this sweep restores the board, todo, and register from snapshots, removes duplicate §5 rows and a duplicated changelog entry, and re-issues designations: LANE-1 GC-201 (+ ERR-045 remainder), LANE-2 GC-302 ungated, LANE-3 PR #19 fix-up (ERR-047, rebase onto 2347aac4), LANE-4 security rotation, LANE-5 POOL-PICK. The first sweep #16 push attempt is pending approval on pre-merge content and is superseded — it must not be approved as-is. Sweep #15's entry (PR #19 FIXES NEEDED, ERR-047) is posted with this update; its own push never landed.


### 2026-10-27 — Sweep #15 (Lead review, out-of-schedule): PR #19 fixes needed, ERR-047 lands (board push did not land — carried into sweep #16)

**Category:** Project governance / Lead review

**Summary:** One new open pull request since sweep #14 (master head still 5fd6a4fc): PR #19 (LANE-3, test support) is FIXES NEEDED — its signer test tests a copy defined in the test file itself (the real signer module, GC-201, is unbuilt) with a self-computed "known answer", and its scheduler test never asserts which queue receives the job, so it cannot catch the ERR-040 routing defect; logged as ERR-047. Its DONE self-report is overridden; no [CLAIM] was posted. PRs #13–#18 unchanged; verdicts stand. Designations: LANE-1 GC-101 fix-up then GC-201, LANE-2 GC-302 gated on PR #14, LANE-3 PR #19 fix-up, LANE-4 standing security rotation gated on PR #15, LANE-5 POOL-PICK. (This entry was drafted in sweep #15 but its board push never landed; it is posted with sweep #16's restoration.)
### 2026-10-27 — GC-101: Environment Variable Sweep & .env.example Sync (Jules / Primary Implementer)

**Category:** Configuration & Governance

**Summary:** Executed full process.env and script environment variable sweep across `src/` and `scripts/`. Confirmed `.env.example` is 100% in sync with all runtime variables read by the application (including eBay, AI, Alerts, and Auth settings) and added explicit DB script connection overrides (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`). Verified zero real secrets/credentials in source control.

### 2026-10-26 — Sweep #12 (Lead review): PR #15 (GC-S1 fix-up) accepted, PR #12 merged by owner, sweep #11 board entries restored

**Category:** Project governance / Lead review
### 2026-10-26 — Pattern Hunting & System Insights Update (LANE-5 / Minion 3)

**Category:** Pattern Hunting / System Insights

**Summary:** Completed standing Scout/Pattern Hunting duties (§6) under POOL-PICK designation. Analyzed recent error register entries in `.logs/errors.md` (ERR-040, ERR-041, ERR-043, ERR-044) and documented 3 new system patterns in `.logs/patterns.md`:
- Pattern 19: BullMQ Queue Instance vs. Job Name Disconnect (ERR-040).
- Pattern 20: Manifest-Source Dependency Sync Pattern (ERR-041).
- Pattern 21: Environment-Gated Fallback Configuration Pattern (ERR-043, ERR-044).

### 2026-10-26 — Fix CI Build and Lint Failure (LANE-5 / Minion 3)

**Category:** Worker Infrastructure / Queue Routing

**Summary:** Fixed the two defects on master identified in Lead review of GC-301:
- ✅ **ERR-040**: Created and exported `refreshQueue` (`product.refresh`) in `src/lib/queue/index.ts` and updated `src/worker/scheduler.ts` to enqueue onto `refreshQueue` instead of `importQueue`.
- ✅ **ERR-041**: Added `"cron-parser": "4.9.0"` to dependencies in `package.json`.
- ✅ Updated unit test in `src/__tests__/worker/scheduler.test.ts` to mock `refreshQueue` and verified all 4 scheduler unit tests pass.
- ✅ Updated `Docs/agent-job-board.md` §5 table state to `DONE` and appended `[DONE]` entry on Message Board.

### 2026-10-25 — Sweep #8 (Lead review): GC-S1 reviewed, FIXES NEEDED; PR #11 not merged

**Category:** Project governance / Lead review

**Summary:** Changed since sweep #8's pushed state: the owner merged PR #11 (LANE-4, GC-S1) at 2026-10-26 ~10:37 AM ET (merge commit b2230f27) despite sweep #8's FIXES NEEDED verdict — verified on master, `src/lib/db/index.ts` now carries the silent local-dev fallback (the fail-closed throw is gone) and the lane's claimed `.logs/errors.md` update still never happened (master errors end at ERR-043, the Lead's own entries). GC-S1's audit findings are accepted (ERR-042 + ERR-016 re-confirmation) and its checkbox stands as merged, but the fix-up is retargeted to master under ERR-043 (updated from branch-only to ON MASTER): restore fail-closed handling or gate any default behind explicit local-development mode, remove the hardcoded dev credential from code, add the missing audit log entries, then Lead re-review. Sweep #10 (~7:32 AM ET) prepared a board/todo/errors update but its push never landed (no approval pending now), so its verdicts are re-issued here: PR #14 (GC-301 fix-up) still ACCEPTED on review, pending merge (GC-301 stays unchecked, ERR-040/041 stay OPEN until then); PR #13 still FIXES NEEDED narrowed (DB fallback cleared at tip e081bb68, lint scope unscoped); PR #12 still FIXES NEEDED (DB fallback present at head 8fa23329, link fixes accepted in substance). ERR-044 lands with this sweep (PR #13 instance cleared, PR #12 instance open). Designations: LANE-1 GC-201, LANE-2 GC-302 gated on PR #14 merging, LANE-3 test support, LANE-4 GC-S1 fix-up on master, LANE-5 Janitor fix-up.


### 2026-10-25 — GC-S1: RANGER Sweep #1 Security Audit Completed (LANE-4 / Minion 2)

**Category:** Security & Compliance / RANGER

**Summary:** Executed RANGER Sweep #1 (GC-S1) across codebase: secrets scan, `npm audit` dependency vulnerability review, and API authorization / RLS check.

**Findings & Changes:**
- ✅ Secrets scan confirmed zero hardcoded credentials or private keys committed in version control.
- ✅ Dependency audit identified 28 vulnerabilities (4 critical, 15 high, 8 moderate, 1 low) in external packages (Next.js, Tinypool, PostCSS, Playwright, Zod).
- ✅ Code review re-confirmed API route authentication gap (hardcoded `DEV_TENANT_ID` fallbacks, unauthenticated handlers).
- ✅ Updated `Docs/agent-job-board.md` §5 table state to `DONE (2026-10-25)` and posted `[DONE]` message board entry.
- ✅ Checked off GC-S1 in `tasks/todo.md`.

### 2026-10-25 — Sweep #7 (Lead review): GC-T1 accepted; GC-301 merged with ERR-040/041 open on master; GC-201 unblocked

**Category:** Project governance / Lead review

**Summary:** Owner merged PRs #8 (GC-101), #9 (GC-301), and #10 (GC-T1) and landed the GC-RS1 brief directly on master (f8ad33c1); zero open PRs remain. Lead verified GC-T1's merged fixtures against its acceptance criterion and accepted it. GC-301's sweep #6 FIXES NEEDED verdict still stands: the merge carried ERR-040 (wrong queue) and ERR-041 (missing cron-parser dep) onto master, so the LANE-2 fix-up now targets current master. Note: the 2026-10-24 GC-301 changelog entry's DONE claim is overridden — GC-301 stays unchecked until the fix-up is accepted. Sweep #6's GC-301 REVIEW entry, lost in the merge resolution, was restored to the board. GC-201 is unblocked (PR #8 merged); GC-R1 continues as a post-merge completeness check.

### 2026-10-24 — GC-301: Repeatable-Job Scheduler Implemented (LANE-2 / Thing 2)

**Category:** Worker Infrastructure / Reliability

**Summary:** Implemented the runtime repeatable-job scheduler for migration 0009's `scheduled_refreshes` table.

**Changes:**
- ✅ Created `src/worker/scheduler.ts` (`processScheduledRefreshes` & `calculateNextRunAt`): queries enabled due `scheduled_refreshes` rows, parses cron expressions using `cron-parser`, enqueues `product.refresh` jobs for specific or tenant-wide products, and updates `last_run_at` and `next_run_at`.
- ✅ Integrated scheduler tick (60s interval + startup check) in `src/worker/index.ts`.
- ✅ Added unit tests in `src/__tests__/worker/scheduler.test.ts`.
- ✅ Marked GC-301 DONE on `Docs/agent-job-board.md`.

### 2026-10-23 — Owner's job-flow model written into the board (§5.1)

**Category:** Project governance / delivery system

**Summary:** Cruze clarified the model he originally intended, and the board now runs on it: workers arrive ambiguous, take a role from the board, claim the next available job for that role in the forum, report completion in the forum, and cross the job out on the board themselves; the Lead's 6-hour sweeps verify, comment in the forum, correct board state, and designate next steps. The five lanes remain as role tracks / first seeding. Builder launch times (Jules side): 12:30 AM, 3:30 AM, 10:30 AM, 4:30 PM, 11:30 PM ET; Lead sweeps ~1:32/7:32 AM & PM ET, with a POOL-PICK fallback covering the 12:30 AM launch.

### 2026-10-23 — Five builder lanes + 6-hour Lead review cadence

**Category:** Project governance / delivery system

**Summary:** At Cruze's direction, the single Jules assignment was restructured into five parallel builder lanes (callsigns Thing 1, Thing 2, Minion 1–3), each with its own track in `Docs/agent-job-board.md` §5, and Lotus set to a ~6-hour review-sweep cadence that designates each lane's next state (NEXT TASK / RESEARCH / PAUSED / IDLE).

**Changes:**
- ✅ Job board §5 re-keyed to lanes: LANE-1 AliExpress build chain (GC-101 in flight), LANE-2 worker infra (GC-301/302), LANE-3 test & fixtures (GC-T1), LANE-4 security (GC-S1 + rotation), LANE-5 flex/research (new GC-RS1)
- ✅ Board §8 added: Lead review cadence and designation rules
- ✅ Lean launch prompts: callsign + board pointer only — rules, roles, and tasks are picked up from the board itself, per Cruze's suggestion

### 2026-10-23 — Agent Job Board, Lead Engineer & Development Plan

**Category:** Project governance / delivery system

**Summary:** Cruze appointed Lotus (Muse) as Lead Software Engineer. Established the agent coordination system the AOP-CORE pipeline assumed but never had: a job board with a message-board forum, a role roster, and a phased development plan to a functional app, sequenced from the 2026-10-22 connector scan.

**Changes:**
- ✅ Created `Docs/agent-job-board.md` — mandatory check-in protocol (board → logs → todo → plan), role roster (Jules = primary implementation in the Forge/Atlas slots; Claude = Oracle/reviewer on check-in; Codex = implementation/test support on check-in; Muse subagents = light duty only), live assignments table, standing idle-duty orders, and the agent-only Message Board (forum) with entry format and rules
- ✅ Created `Docs/development-plan.md` — Phases 0–5 to the functional thin vertical slice (real AliExpress import → comps pricing → eBay Trading submit): small daily tasks with owners, dependencies, acceptance criteria, OWNER-GATED markers, and a roadblock/research protocol
- ✅ First delegations posted on the board and mirrored below (GC-101, GC-201, GC-202, GC-R1, GC-T1, GC-S1)
- ✅ Governance + security-maintenance gaps logged as ERR-038 / ERR-039 in `.logs/errors.md`

**Impact:**
- Agents (Jules on cron check-ins, plus any future Claude/Codex/other agents) now have one place to check before acting, assigned roles, and a task queue that leads to a working app instead of ad-hoc work

### 2026-08-12 — UI Foundation Recovery

**Category:** UI/UX Foundation

**Summary:** Fixed critical UI foundation issues that were blocking frontend development, following the UI Recovery Brief specification.

**Changes:**
- ✅ Installed Tailwind CSS v3 and PostCSS configuration (was missing despite Tailwind config existing)
- ✅ Created global CSS with comprehensive design token system (colors, typography, spacing, accessibility)
- ✅ Replaced unsupported HeroUI Layout components with GhostCart-owned semantic HTML + Tailwind shell
- ✅ Fixed AppShell component to use CSS Grid/Flex instead of fictional HeroUI Layout.* API
- ✅ Updated Sidebar component with Lucide React icons (replaced emoji navigation)
- ✅ Updated TopNav component with Lucide React icons and proper HeroUI integration
- ✅ Fixed toast provider by replacing HeroUI Toast with custom accessible implementation
- ✅ Extended Button and Input wrappers with standard form props (type, name, value, form, etc.)
- ✅ Resolved Next.js auth-route export error by moving authOptions to separate lib file
- ✅ Fixed import statements to remove .js extensions that were causing build errors
- ✅ Removed incompatible HeroUI Tailwind plugin from configuration

**Impact:**
- Build now compiles successfully
- UI foundation follows the correct ownership model: GhostCart semantic HTML + Tailwind for structure, HeroUI v2 for verified interactive primitives only
- Design token system is now active and accessible
- Navigation uses professional Lucide icons instead of emoji
- Form components properly support standard HTML form attributes

**Follow-up needed:**
- Pre-existing linting errors (unused variables, any types) remain but are not blocking the UI foundation work
- Need to certify one vertical slice (sign-in → import → review → draft) with real API states

---

## Stage 0 — Product Validation and Operating Constraints

**Goal:** Prove there is a permitted, valuable first workflow before significant implementation.

- [ ] Name one target user persona, one target marketplace, and one approved supplier/import source
- [ ] Write a concise PRD for the thin vertical slice with acceptance criteria
- [ ] Confirm marketplace API availability, sandbox access, rate limits, scopes, webhooks, and listing-policy constraints
- [ ] Define data collection, access, retention, and support/escalation ownership
- [ ] Establish pilot metrics: completion rate, median import-to-draft time, import accuracy, publish failure rate, pilot retention
- [ ] Create low-fidelity wireframes for import, product review, listing draft, and activity/error states
- [ ] Run 5–10 target-user interviews or usability sessions confirming workflow and terminology
- [ ] Time-box design-system evaluation (accessibility, React/TypeScript fit, theming, maintenance, licensing)
- [ ] Document approved-integration path or safe export-only fallback

**Exit evidence:** Signed-off workflow, documented integration path, user validation complete.  
**Do not proceed if:** source/marketplace use is unauthorized, user value unvalidated, or safe test credentials unavailable.

---

## Stage 1 — Foundation and Clickable Workflow

**Goal:** Make the core interaction testable quickly without pretending the system is automated.

### Platform and infrastructure
- [x] Scaffold TypeScript app (React/Next.js web client + server-side API routes or small Node API layer)
- [x] Set up repository conventions, linting, formatting, unit-test runner (Vitest), and E2E (Playwright)
- [x] Add local Docker Compose (app, PostgreSQL, Redis / worker queue dependency)
- [x] Add environment-specific configuration and committed `.env.example` (never commit secrets)
- [x] Implement PostgreSQL schema migrations runner with rollback/recovery procedure (`// @agent:archivist`) — `src/db/migrate.ts` + `0002_harden.sql`, `0003_rls_seed.sql`
- [x] Add health checks, structured logs, error tracking, and correlation IDs

### Security and tenancy (required from day one)
- [x] Implement sign-in for development, roles, tenant-scoped tables, and tenant ID propagation (`// @agent:forge`)
- [x] Add basic database schema for roles and audit log (`src/db/migrations/0001_init.sql`)
- [x] Add request validation and idempotency keys for imports, external submissions, and job handlers (`src/lib/validation/schemas.ts`)

### Domain model (first slice)
- [x] Create core data models and TypeScript types: tenants, users, roles, suppliers, products, product sources, listing drafts, marketplace connections, jobs, audit events (`src/lib/types/index.ts`)

### Frontend (minimal — four screens only)
- [x] Build minimal app shell and screen routes: sign-in, import form, product review, listing draft (`src/app/`)
- [x] Use fixture data and mock adapter behind formal interface (`src/lib/adapters/mock.ts`)
- [x] Implement loading, empty, and error states for screens (`src/components/ui/`)
- [x] Start internal component layer: Button, Input, Select, Dialog, DataTable, StatusBadge, EmptyState, ErrorState, PageHeader

### API and testing
- [x] Define first API contracts and error states (`src/app/api/products/route.ts`, `src/app/api/listings/route.ts`)
- [x] Unit tests: mock adapter mapping, price calculations, health check API (`src/__tests__/`)
- [x] Browser-level smoke test scaffold (`e2e/smoke.spec.ts`)

**Test gate:** New developer can clone, configure, start, and run tests (`npm test`, `npm run dev`); test user completes workflow against fixtures.

---

## Stage 2 — Functional Alpha: Real Product Import

**Goal:** Replace one mock boundary with a real, authorized data source.

- [x] Implement one supplier/catalog adapter (authorized API, feed, or user-provided CSV) — `src/lib/adapters/csv.adapter.ts`
- [x] Build adapter contract interface: `validateConnection`, `importProduct`/`fetchProduct`, normalization to canonical models — `src/lib/adapters/supplier.interface.ts`, `factory.ts`, `normalize.ts`
- [x] Normalize product title, identifiers, images, price, availability, source URL, and timestamp — `src/lib/adapters/normalize.ts`
- [x] Store raw-source metadata for traceability; display confidence/errors to merchant — worker → `product_sources`; `GET /api/products/[id]/review-status`
- [x] Queue imports and refreshes with retryable, idempotent handlers — BullMQ `product.import` + `product.refresh`; `src/worker/index.ts`
- [x] Add manual product correction and review-before-use state — `approve`/`corrections`/`review-status` routes, `ProductCorrectionForm`; `0004_user_corrections.sql`, `0014_review_state.sql`
- [x] Instrument import duration, job failure reason, normalization completeness, duplicate rate — worker + `dashboard` views
- [x] Integration tests against adapter sandbox, recorded fixtures, or contract-test harness — `src/__tests__/integration/csv-adapter-integration.test.ts`, `src/__tests__/api/products-stage2.test.ts`

**Test gate:** Duplicate requests tolerated; transient errors don't create duplicate products; pilot users import bounded test set without developer intervention.

---

## Stage 3 — Functional Beta: Listing Preparation and One Publish Path

**Goal:** Deliver an outcome a merchant can use, with deliberately limited blast radius.

- [x] Add listing templates and editable title, description, attributes, images, price, and shipping fields — `listing_drafts` + `src/app/api/listings/**`, draft page
- [x] Add AI-assisted rewrite as draft-generation only (require user review; preserve original source content) — `POST /api/ai/rewrite`, `src/lib/ai/ai-client.ts`
- [x] Integrate one marketplace sandbox or first release path (CSV/export fallback if direct publishing not approved) — eBay submit + CSV export:`/api/ebay/submit`, `/api/ebay/export/csv`
- [x] Persist listing state transitions: `draft` → `ready_for_review` → `queued` → `submitted` → `published` → `failed` — `listing_drafts.state`; `0006_ebay_integration.sql`
- [x] Verify webhook signatures where available; reconciliation/polling only where permitted — HMAC-SHA256 in `src/lib/adapters/ebay/webhook-handler.ts` + `polling-service.ts`
- [x] Provide activity history, error details, retry controls, and kill switch for submission jobs — `/api/jobs/activity`, `/api/jobs/[id]`, `/api/jobs/[jobId]/retry`, `/api/jobs/kill`
- [x] Contract/integration tests for marketplace payload mapping and expected error responses — `src/__tests__/integration/ebay/listing-mapper.test.ts`
- [x] End-to-end tests: import → export/publish in test environment — `e2e/import-workflow.spec.ts`, `e2e/ebay-submission.spec.ts`, `e2e/ai-rewrite.spec.ts`, `e2e/error-scenarios.spec.ts`
- [x] Run controlled beta with small invited cohort under monitored limits — `/api/admin/beta-users` + feature flags; `0008_feature_flags.sql`

**Test gate:** Every external submission has audit entry, idempotency key, and user-visible result.

---

## Stage 4 — Reliability and Controlled Automation

**Goal:** Make the proven workflow safe to repeat at low volume.

- [x] Add stock/price refresh from the same approved data source — `0009_stock_price_refresh.sql`; `product.refresh` worker; `/api/products/[id]/refresh`
- [x] Build deterministic margin calculations (fees, taxes, shipping, rounding rules) — `src/lib/margin/calculator.ts`, `0010_margin_calculation.sql`, `/api/listings/calculate-margin`
- [x] Add repricing **suggestions** first; automatic repricing only with explicit merchant rules, floors/ceilings, dry-run, previews, alerts, and global pause — `src/lib/repricing/engine.ts`, `0011_repricing_system.sql`, `/api/repricing/suggest|apply|pause`
- [x] Add operational dashboards: import success, listings by state, job failures, suggested margin — `0013_dashboard_views.sql`, `/api/dashboard/metrics`
- [x] Add per-tenant and per-integration rate limiting — `src/lib/rate-limiter.ts`, `src/lib/middleware/rate-limit.ts`, `0012_rate_limiting.sql`
- [x] Establish secrets rotation process, backups/restore tests, alerting, and incident runbooks — `scripts/backup-db.sh`, `scripts/restore-db.sh` (non-interactive via `RESTORE_CONFIRM`), `scripts/restore-test.sh`, `scripts/rotate-secrets.sh` (env names aligned to `.env`), `scripts/verify-secret.sh`, `scripts/encrypt-env.sh`/`decrypt-env.sh` (age); `src/lib/alerts/` + `0015_alerts.sql` + `user.worker` hooks; `.github/workflows/ci.yml`; `Docs/incident-runbooks.md` updated
- [x] Failure-injection tests for job retries and reconciliation — `src/__tests__/integration/failure-injection/worker-failure.test.ts`, `src/__tests__/integration/jobs/retry-policy.test.ts`
- [x] Verify pause action stops queued automation before external side effects — `src/__tests__/integration/pause-verification.test.ts`

**Test gate:** Restore non-production backup successfully; pilot SLOs met for defined observation period.

---

## Stage 5 — Expand Integrations and Team Capabilities

**Goal:** Generalize only patterns that succeeded in the pilot.

- [ ] Build adapter contract and certification checklist before second supplier or marketplace
- [ ] Add second marketplace integration (only after first path is stable)
- [ ] Add roles, invitations, approval policies, and immutable activity history
- [ ] Introduce event publication and additional workers when tested workload requires them
- [ ] Add order-management features as review-first workflows (no automated purchasing until controls mature)
- [ ] Establish analytics model using replicated/aggregated operational data (not transactional DB reporting queries)
- [ ] **Security gate before Stage 5 expansion:** add a shared server-side API auth/RBAC guard; replace every `DEV_TENANT_ID` route fallback with the authenticated session tenant; reject production startup when dev credentials or placeholder `NEXTAUTH_SECRET` are configured
- [ ] **Tenant-isolation certification:** run cross-tenant API tests using the least-privilege `ghostcart_app` role and verify every tenant-scoped query executes inside `withTenant()`/RLS context
- [ ] **Deployment decision and productionization gate (ERR-020):** record an ADR confirming standalone Dockerized Next.js (not WordPress) as the application host; select a container-capable host; add a production Dockerfile and deployment configuration with separate web and BullMQ worker processes, production health checks, secure secrets, backups/restore, and rollback instructions

**Test gate:** Each adapter passes contract, rate-limit, security, and recovery tests; tenant isolation verified across new queries and jobs.

---

## Stage 6 — Scale and Enterprise Options

**Entry criteria:** Sustained measured load, bounded services, defined ownership, security review, reliable pilot operations.

- [ ] Extract independently scaling services when deployment/scaling/ownership requires it
- [ ] Introduce message broker (Kafka/RabbitMQ) with versioned event contracts when durable queue is insufficient
- [ ] Add dedicated analytics infrastructure, advanced reporting, and data-retention controls
- [ ] Evaluate additional marketplace integrations (Amazon SP-API, Etsy, Shopify, Facebook, etc.)
- [ ] Evaluate self-hosting, third-party API access, mobile clients, white-label, and predictive features

---

## First 30-Day Execution Checklist

1. [ ] Select one merchant persona, supplier/input method, and marketplace/export path
2. [ ] Confirm policy, API/sandbox, data-handling, and support constraints
3. [ ] Write acceptance criteria and low-fidelity wireframes for the thin vertical slice
4. [ ] Choose initial stack and component primitives through time-boxed evaluation
5. [ ] Scaffold app, local environment, CI, tests, database migrations, and fixtures
6. [ ] Build authenticated tenant-scoped product import using mock adapter
7. [ ] Build product review and editable listing draft UI with real loading/error states
8. [ ] Replace mock with one authorized import adapter or CSV ingestion
9. [ ] Add safe export or marketplace-sandbox submission path and audit history
10. [ ] Run controlled usability and functional pilot; use evidence to set Stage 4 priorities

---

## Explicitly Deferred (Non-Goals for First Release)

Do not start these until Stages 0–3 are complete and pilot evidence supports expansion:

- Multiple marketplace integrations in parallel
- Kafka/RabbitMQ, microservices, API Gateway, service discovery, Kubernetes
- WordPress admin plugin (standalone Next.js app first)
- Autonomous purchasing, payment handling, or managed buying accounts
- Browser automation without written supplier permission
- CRM, predictive analytics, mobile app, self-hosting, white-label
- Full Frontend UI Component Tree before the first four screens are useful
- Auto-repricing without merchant rules, dry-run, and global pause controls

---

## Ongoing Tasks

- [ ] Monitor system performance and pilot metrics
- [ ] Update marketplace API integrations as vendor APIs change
- [ ] Security audits and credential rotation
- [ ] Documentation and ADR updates (framework, auth, tenant isolation, queue, first integration, design system)
- [ ] Keep [plan.md](./plan.md) aligned with Production Blueprint staging
- [ ] Add correlation/request IDs to API and worker logs; standardize structured error events and redact external webhook payloads before logging
- [ ] Keep local Docker Compose, production topology, and deployment runbooks synchronized; do not describe a dev-only `next dev` container as a production deployment

## Bug Fixes and Maintenance

- [ ] **UI recovery gate (ERR-019):** freeze UI-library additions; repair the shell with a custom semantic/Tailwind `AppShell` (not a fictional HeroUI `Layout` API), then make `tsc`, lint, keyboard navigation, and responsive navigation checks pass before starting dashboard work
- [ ] Consolidate Prism documentation into one approved implementation brief; mark the WordPress/shadcn UI tree and the contradictory shadcn sections of `DESIGN_PROPOSAL.md` as historical/aspirational
- [ ] Define and test the GhostCart wrapper contracts (`Button`, `Input`, `Toast`) before page adoption; wrappers must expose the native form semantics required by consumers (`type`, `name`, `required`, disabled, and value-change behavior)
- [ ] Fix webhook reliability issues (when webhooks are in use)
- [ ] Optimize database queries as data volume grows
- [ ] Improve error handling and user-visible failure recovery
- [ ] Enhance logging, monitoring, and alerting

---

## 📌 Decision Log — Import Pipeline Strategy (2026-08-06)

> **Decision:** Adopted **Option C** — worker + enqueue with graceful degradation.
> Full rationale: see `Jaydr Journal/Jaydr Memo` → "Decision Memo."

**Implemented (Stage 1):**
- [x] `POST /api/products` enqueues a real BullMQ `product.import` job
      (lazily imported queue module, guarded by `process.env.REDIS_URL`, fallback 202)
- [x] Worker resolves adapter via `src/lib/adapters/factory.ts`, calls `importProduct()`,
      persists to Postgres (`products` + `jobs` + `audit_events`), returns `{ productId }`
      (persistence wrapped in try/catch — graceful degradation)
- [x] `mock.adapter.ts` `mockProduct` fixture added; broken route import fixed
- [x] `Dockerfile.dev` created to unblock `docker-compose up`
- [x] `TECHNICAL_WIKI.md` amended (§7.2, §11, §12.5, §12.6, §12.11; `e2e/` marked existing)

**Known limitations (Stage 1 tradeoff):**
- [ ] DB/Redis outages degrade (log + complete) rather than retry — tighten retry
      semantics + dead-letter queue in Stage 2
- [x] `npm run db:migrate` implemented (src/db/migrate.ts) — resolves the TODO-echo limitation (`@agent:archivist`)
- [ ] `0001_init.sql` archivist TODOs (RLS, constraints, indexes, encryption, seeded
      tenant/supplier rows) not yet applied — canonical `identifiers`/`additionalImageUrls`/
      `confidence` fields mapped to `product_sources.raw_source_metadata` in Stage 2

**Feature improvements for consideration:**
- [ ] Add idempotency-key dedup at the route layer (reject duplicate imports)
- [ ] Add job status polling endpoint `GET /api/jobs/[id]`
- [ ] Wire `POST /api/listings/[id]/submit` to `listingQueue` (Stage 3+)

---

## 📋 Proposed Stable Plan — Design & Deployment (OPEN for later deliberation)

> Status: PLAN-REVIEW. Decision-making record, NOT a locked plan. Re-evaluate
> when the time is right (component-library selection, deployment commitment).
> Companion note: `Jaydr Journal/Jaydr Memo` → "Proposed Stable Plan".

**Locked so far:**
- ✅ Styling base: **Tailwind CSS** (approved)
- 🟡 Component library — **OPEN**: shadcn/ui (Radix) vs **Lightswind UI** vs **MeetUI**
- 🟡 Deployment model: Dockerized standalone Next.js mod-monolith
     (app + PostgreSQL + Redis + worker) — **NOT** WordPress / not a plugin (non-goal)
- 🟡 Host — **OPEN**: VPS (DigitalOcean) / Fly.io / Railway / Render (or TBD)
- 🟡 Animation: CSS-first; anime.js deferred until concrete needs

**Logic / why (decision trail):**
- Design-system must be React/Next-native, license-safe, accessible, and map onto
  the existing component primitives (Button, Input, EmptyState, ErrorState,
  PageHeader, StatusBadge) so we strengthen stubs instead of discarding them.
- Worker + durable queue + PostgreSQL favour a container-capable host over a
  serverless-only (Vercel) shape; Vercel = frontend inspiration, not sole hosting
  for this stack.
- WordPress/plugin + microservices/Kafka remain deferred (Stage 3+); see
  TECHNICAL_WIKI §1.3 for the aspirational-vs-current distinction.
- Formal ADRs (`deployment platform`, `design-system foundation`) to be written
  only once the component library and host are chosen.

**Deployment reality check (2026-08-12, ERR-020):** Docker Compose is present only for
local development (`Dockerfile.dev` runs `next dev`; Compose defines `app`, `db`, and
`redis`). There is no WordPress service or plugin code in this repository, no production
Dockerfile, no Compose worker service, and no active remote deployment configuration.
The intended production shape remains a container-capable host running separate web and
worker processes with PostgreSQL and Redis; finalize it through an ADR before a pilot.

---

## 🔐 SECURITY-DEBUG Notation — Security & Debugging Posture (later stages, Stage 4+)

> Label: **SECURITY-DEBUG**. Forward-looking notes for enterprise hardening +
> debugging. **NOT** Stage 1–2 work.

- [ ] **Security Posture Overlay / debug panel** — operator overlay to inspect
      authN/authZ state, tenant isolation (RLS) enforcement, secrets handling,
      audit-trail coverage, rate limiting, security headers/CSP, dependency/CVE status
- [ ] **Webhook event log pages** — inbound/outbound delivery records (see Jaydr Journal note)
- [ ] **General log-view pages** — audit log, application/error log, job/queue history,
      integration/environment status
- [ ] **Debug facilities tied to the overlay** — correlation ids / request tracing,
      RBAC preview, "what would RLS allow?" inspector, feature-flag view
- [ ] **Link to** `@agent:scout` (observability) + a future security-review workstream
- [ ] **Align with** Production Blueprint §7.1 (authorization boundaries,
      backup-restore tests) and `tasks/todo.md` Stage 4 hardening items

---

## 🤝 Agent Job Board — Active Delegations (2026-10-23)

> Coordination hub: [`Docs/agent-job-board.md`](../Docs/agent-job-board.md) — agents must check the board (assignments + message board) before working. Plan: [`Docs/development-plan.md`](../Docs/development-plan.md). If this list and the board disagree, the board wins and the Lead fixes this file.

- [ ] **GC-100** — All agents: check in on the job board Message Board and confirm roles (Lead: Lotus)
- [x] **GC-101** — Jules: sync `.env.example` with every env var the code reads (full `process.env` sweep of `src/` + `scripts/`)
- [x] **GC-201** — Jules: AliExpress HMAC-SHA256 signer module + fixture unit tests (dummy secret only) — merged (PR #29, 2026-10-29); ERR-047 CLOSED
- [ ] **GC-202** — Jules: AliExpress token provider (transient secret, expiry-aware refresh, mocked-HTTP tests, no plaintext persistence; GC-102 DECIDED 2026-10-29 — Option 2 hybrid AES-256-GCM; UNGATED — GC-201 merged 2026-10-29).
- [ ] **GC-R1** — Claude (on check-in): second-eyes review of GC-101 against `process.env` reads in `src/`
- [x] **GC-T1** — LANE-3 (Minion 1): `aliexpress.ds.text.search` response fixture pack (full / empty / error envelope) — completed 2026-10-25
- [x] **GC-301** — LANE-2 (Thing 2): BullMQ repeatable-job scheduler + `scheduled_refreshes` consumer (fix-up completed 2026-10-25)
- [ ] **GC-302** — LANE-2 (Thing 2): register the missing `listing.submit` worker processor — worker merged (PR #23, 2026-10-29); acceptance gap tracked in GC-302-FU1 (ERR-052).
- [ ] **GC-302-FU1** — LANE-2 (Thing 2): listing.submit enqueue path (ERR-052; PR #23 merged 2026-10-29, ungated) — route the submit flow through `listingQueue` with a payload matching the processor contract, plus a test proving an enqueued job is picked up and failure lands in DLQ
- [ ] **GC-L6-02** — Listing-draft creation conflict path (ERR-054, follow-up from PR #32 review): on duplicate source, return the existing draft instead of crashing; test the duplicate path
- [x] **GC-RS1** — LANE-5 (Minion 3): research brief for the GC-102 credential-storage decision (brief only, no code) — Lead-reviewed 2026-10-25; brief landed on master 2026-10-25 (commit f8ad33c1), PR #7 closed as redundant
- [x] **GC-S1** — First idle checked-in agent (Lead assigns): RANGER sweep #1 — secrets-pattern scan (locations/types only) + dependency vulnerability summary, reported on the board — completed 2026-10-25 (LANE-4) — audit findings accepted 2026-10-26 (sweep #11); post-merge fix-up ACCEPTED on review 2026-10-26 (sweep #12, PR #15) pending merge; ERR-043 closes at merge
