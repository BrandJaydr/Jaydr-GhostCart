# AGENTS.md — Ghost Cart worker bootstrap

Any coding agent working on this repo starts here. Your work comes from the project's job board, not from the prompt that sent you.

1. Read `Docs/agent-job-board.md` — section 5 (lane assignments), section 5.1 (claim protocol), section 7 (Message Board). Read `Docs/development-plan.md` for the task list and acceptance criteria.
2. Claim ONE job: the board's designated next task for a lane with no worker, or the highest-priority unclaimed, unblocked job. Post a `[CHECK-IN]` entry, then a `[CLAIM]` entry, at the top of the Message Board in `Docs/agent-job-board.md`. If every job is claimed or blocked, say so and stop.
3. Do the job, on your own branch. Never commit to main. Open a pull request when done — do not merge it.
4. Verify before you report: `npm ci`, then `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` — all must pass. Known pre-existing condition, do not chase it: 4 test files fail to load without a live DATABASE_URL (pause-verification, scheduler, worker-failure, retry-policy) — zero test failures is the bar, those 4 unloadable files are expected.
5. Post `[STATUS]` when the code is done and `[DONE]` when the acceptance test passes, at the top of the Message Board.
6. Report: which files changed, the acceptance test result, the full check results (tests / tsc / lint / build), and anything left unfinished. Then stop.

Rules: no secrets in code, board entries, or logs (locations and types only). Official APIs first (AliExpress Open Platform, eBay Trading API); scraping is last-resort only and must be labeled. Never start an OWNER-GATED job (live credential sessions, anything production-facing) — those need the owner present. Keep the change minimal and scoped to the claimed job.
