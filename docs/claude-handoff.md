# Claude handoff — HarflowWeb

Implementation is paused. This file is a session handoff, not product
documentation. Do not start another feature, push, deploy, or publish from
this note. The owner hands the checkout to Claude to save the previous
session’s limit.

- Written: 2026-11-06
- Repository: `/Users/Shared/Code/Harflow/HarflowWeb`
- Branch: `main`
- HEAD at handoff: `57b91406e1000b813731fb27a1f5e64f0576f2fb`
- Tracking: `main` is 19 commits ahead of `origin/main`. Nothing in this
  slice has been pushed.
- Working tree before this file: clean

## What this repository is

HarflowWeb is an exploratory mock-backed slice for review. It is not
W01–W05 completion, production Web, authentication, or a real engine
connection. Production roadmap remains native Mac + Rust first; Web later.

Read `AGENTS.md`, `docs/migration-plan.md`, and `docs/migration-sessions.md`
before expanding scope. Plans do not authorize live operations or publication.

Clean layers under `src/`: `model`, `application`, `presentation`,
`components`, `features`, `adapters/mock`, `composition`. Construct concrete
mock adapters only in `src/composition/`. Builds and tests must not depend
on sibling checkouts. Do not edit HarflowMac, migration trackers, or sibling
repositories unless the owner explicitly assigns that work.

## Design pin for the workflow run

HarflowDesign commit `3643d083700be4032c93237813b573d04bab6ab1`

- Path: `v2/scripts/screens-workflow-run.js`
- State: `workflow-run/graph-needs-you`
- Hosted `https://design.harflow.dev/v2` is for visual inspection only. Pin
  the commit above for provenance.

The Needs you card comes from the same design commit,
`v2/scripts/screens-needs-you.js`, state `needs-you/waiting`. The two
specimens disagree. The shared snapshot follows the Needs you request.
Documented in `src/adapters/mock/nightlyPublishSnapshot.ts` and
`docs/provenance.md`.

Adapted away from the graph specimen:

- Branch `audit/2026-11-03` → `deps/audit-2026-11-03`
- Model `Codex · gpt-6` and approval source `Codex · Worker` →
  `Codex · gpt-6-astra`
- Publish wording “on HarflowMCP” → “in HarflowMCP”

Kept from the graph specimen: node role labels “Claude · Worker” and
“Codex · Worker”, remote `Harflow-Dev/HarflowMCP`, pull-request title
“Upgrade 3 dependencies”, and each surface’s own Can publish sentence.

## Identities

These are different ids. A definition id must not borrow a run, and a run
id must not borrow another run.

| Fact | Value |
| --- | --- |
| Workflow definition id | `wf-nightly-audit` |
| Workflow run id | `run-nightly-dependency-audit` |
| Needs you item | `approve-nightly-publish` |
| Selected node | `run-open-pull-request` |
| Mapped task used by the leave regression | `task-slot-release` |

`observeWorkflowRun(workflowId)` is the launch form. `observeWorkflowExecution(runId)` is the running graph. Code names the graph session “execution” so it does not collide with the form types.

## What is already committed

Recent commits on `main`, newest first:

| Commit | Purpose |
| --- | --- |
| `57b9140` | Cancel the run when a mapped sidebar task leaves it |
| `8ec4388` | One publish snapshot, accessible node status, close the run when navigation leaves |
| `783b729` | Read-only Nightly run graph opened by its mapped run id |
| `af91feb` | Read-only MCP approvals expansion in Settings → Harnesses |
| `22119a0` | Orchestrator turn-limit row and left-aligned “Always present” |
| `78b1eea` | Read-only Orchestrator inspector |
| `2c0cf08` | Mock-backed workflow editor with reachable routed graphs |

The run screen shows only when `workflowExecution.runId !== null` and
`route === 'workflows'` (`src/features/AppFeature.tsx`). Needs you →
“Open run Nightly dependency audit” calls `openWorkflowExecution`. The
workflow-list Run control still opens the launch form by definition id.
Unmapped Open run stays disabled.

### Run lifetime

`WorkflowExecutionSession.close()` bumps the epoch, cancels the observation,
and publishes `runId: null` with a loading load. `apply()` ignores a callback
when the session is disposed, the generation mismatches, the run id
mismatches, or a ready payload’s `run.runId` is not the requested id.

`AppSession.closeWorkflowExecution()` is the shared guard. It runs from:

- `navigate()`, for every route while a run is open, including a Workflows
  click that dismisses the run
- `openTask()`, because that method sets `route = 'task'` directly and does
  not go through `navigate()`

Returning to Workflows must show the list. It must not call
`openWorkflowExecution` again. Stored workflow-form drafts and editor
selections stay. `openWorkflowRun` and `openWorkflowEditor` are separate
sessions and must not be cleared by run cleanup.

### Accessibility

The canvas port is `role="region"` named “Workflow graph”. The scaled drawing
is `aria-hidden`. `WorkflowRunCanvas` renders an `.hd-sr` list named with
`run.graphLabel`. Every node, path and standalone, is a list item with status
and selected state. Open pull request is `aria-current="true"`. Standalone
strip buttons also say “not selected”. Thin scrollbars stay. The canvas port
sets `scrollbarGutter: 'auto'` so the stable gutter does not clip Notify.
The approval card sets `flex: 'none'` so Approve and Reject stay inside the
card and the pane can scroll to them.

### Disabled mutations

Pause, Cancel, Approve, Reject, Revise goal, Parallel, More actions, and
on-demand node details stay disabled. Explanation id
`workflow-run-unavailable`:

“Unavailable. This control does not pause, cancel, approve, reject, revise the goal, or open another run view.”

There is no approval authority.

## Files that own this slice

- `src/model/ids.ts` — `WorkflowRunId`
- `src/model/workflowExecution.ts` — run observation types
- `src/model/needsYou.ts` — workflow context `runId`
- `src/adapters/mock/nightlyPublishSnapshot.ts` — the one shared request
- `src/adapters/mock/workflowExecutionFixtures.ts` — `nightlyAuditRun()`
- `src/adapters/mock/needsYouFixtures.ts` — Nightly card reads the snapshot
- `src/application/loadWorkflowExecution.ts` — use case
- `src/presentation/workflowExecutionSession.ts` — epoch, cancel, stale apply
- `src/presentation/workflowRunScene.ts` — Mac orthogonal router, scale 0.7, padding 0
- `src/presentation/appSession.ts` — route lifetime
- `src/components/WorkflowRunCanvas.tsx`, `WorkflowRunDetail.tsx`, `WorkflowRunView.tsx`
- `src/features/WorkflowRunMain.tsx`, `AppFeature.tsx`, `NeedsYouMain.tsx`
- Tests: `workflowExecutionSession.test.ts`, `appSession.test.ts`,
  `WorkflowRunView.test.tsx`, `nightlyPublishSnapshot.test.tsx`,
  `AppFeature.test.tsx`, `NeedsYouPage.test.tsx`
- Docs already updated: `docs/architecture.md`, `docs/provenance.md`,
  `docs/mock-scenarios.md`, `docs/review-notes.md`, `docs/visual-validation.md`

## Checks last recorded on `57b9140`

- `npm run verify`: architecture 137 files, 22 warnings, all under the error
  limits; 149 tests passed; build succeeded
- `npm run lint`: only the two existing `src/components/sidebarNav.tsx`
  fast-refresh warnings
- `git diff --check`: clean
- `nightlyAuditRun` warns at 72 lines. Target is 50, max is 80. Warnings under
  the max are acceptable. Errors are not.
- No independent Codex review of the run work. `gpt-6-luna` and `gpt-6.1-sol`
  were not available in that session. Do not describe a review that did not
  happen.

## Visual evidence

Outside the repository:

`~/.codex/workflows/screenshots/2026-11-06-harflowweb-workflow-run-graph/`

- `01-graph-needs-you-light.png`
- `02-graph-needs-you-dark.png`

Both are 1280×800, captured from `/` after Needs you → Open run Nightly
dependency audit, with the detail pane scrolled so Approve is visible.
Measured at that size: canvas port client and scroll width 556, Notify’s box
ends at 543, pane max scroll 57px, Approve bottom 792. Recapture both themes
in the same turn as `Emulation.setDeviceMetricsOverride` if the pixels change.
Clear device metrics and unlock the browser afterward.

A Vite dev server for this checkout has been used at `http://127.0.0.1:5173/`.
Confirm it is still the one you intend before treating the page as current.

## Still outside this assignment

- Parallel, recovery, and on-demand detail views
- Connecting an engine, reading local state, executing commands, or
  implementing approval authority
- Enabling Pause, Cancel, Approve, Reject, goal edits, or other mutations
- A second run specimen
- Push, deploy, release, or migration-tracker edits

## If the owner assigns more work

1. Preserve uncommitted work. Do not revert `57b9140` or the commits above.
2. Keep workflow-definition ids distinct from run ids. Missing or mismatched
   identities must not borrow another run’s data.
3. Any new route that leaves the run must cancel the observation. A direct
   route assignment that skips `navigate()` is how `openTask()` leaked.
4. Keep editor selections and workflow-form drafts.
5. Add a focused regression before calling the change done.
6. Run `npm run verify`, `npm run lint`, and `git diff --check`.
7. Commit only when the owner asks. Do not push unless the owner asks.
