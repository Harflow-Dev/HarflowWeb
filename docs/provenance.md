# Design and contract provenance

## Design (approved specimens)

- Repository: https://github.com/Harflow-Dev/HarflowDesign
- Immutable commit: `3643d083700be4032c93237813b573d04bab6ab1`
- Paths:
  - `v2/docs/approval.md`
  - `v2/docs/screen-inventory.md`
  - `v2/scripts/screens-new-task.js`
  - `v2/scripts/screens-workflows.js`
  - `v2/scripts/screens-resources.js`
  - `v2/scripts/screens-statistics.js`
  - `v2/scripts/screens-settings.js`
  - `v2/scripts/screens-task.js`
  - `v2/scripts/screens-workflow-run.js`
  - `v2/scripts/components.js`
  - `v2/styles/tokens.css`
  - `v2/styles/bundle.css` (vendored into `src/styles/`)
- States implemented:
  - `new-task/default/light` and `/dark`
  - `new-task/harness-menu/light` and `/dark`
  - `new-task/sidebar-collapsed/light` and `/dark`
  - `workflows/list/light` and `/dark` (list chrome without product search; see
    coverage ledger deliberate removal of product search)
  - `workflows/empty/light` and `/dark`
  - `resources/slots/light` and `/dark` (populated, full-with-waiters, zero-holder,
    and not-installed cards; waiting list)
  - `statistics/overview/light` and `/dark` (range selector retained; 7-day and
    30-day populated fixtures; All time selects retained-history incomplete
    coverage rather than inventing all-time totals)
  - `task/running/light` and `/dark` (slim header, transcript, expandable tools,
    running indication, follow-up composer shell — send/stop unavailable; no
    right pane, task tabs, or approvals)
  - `task/failed/light` and `/dark` (failed badge, diagnostic transcript, failure
    banner; Retry / Copy resume command / follow-up send unavailable; no
    right pane or generated shell commands)
  - `task/done/light` and `/dark` transcript + summary + **read-only Changes
    pane** (done badge, diagnostic transcript, Summary section, follow-up send
    unavailable; Changes open/close with fixture file rows and selected diff).
    Artifacts and Events tabs remain explicitly unavailable. The specimen’s
    Artifacts/Events destinations and any edit/download/apply actions are not
    implemented.
  - `settings/general/light` and `/dark` (General page composition). Appearance
    uses the shared session System/Light/Dark state and is not persisted.
    Behaviour switches, runtime update checks, and task-store actions stay
    unavailable or read-only specimen facts.
  - `settings/harnesses/light` and `/dark` (registration, install badges, and
    qualification). Installation, MCP registration, and qualification are
    independent fixture facts. Refresh, update, and remove stay disabled.
    MCP approvals expands that harness’s explicit fixture list from
    `settings/mcp-approvals`. Add and Remove stay disabled. Unknown or missing
    approvals stay unavailable and are not an empty list. Paths and readiness
    sentences are specimen copy, not this computer.
- Visual inspection also used hosted `https://design.harflow.dev/v2` (cheaper than a
  local archive server). Hosted content may be newer than the pinned commit;
  implementation citations remain the immutable commit above.
- `v2/docs/migration-coverage.md` is **absent** at the pinned commit (added in
  later commits such as `268b917`). Coverage ledger was not available for that
  pin; approval + screen-inventory were used instead. Later accepted coverage
  decisions (for example deliberate product-search removal, retain task
  transcript / tool calls / follow-up composer, remove task-level Summary and
  Prompt tabs) still override obsolete specimen controls. Statistics range
  selection is retained.

## Engine contract mapping (HarflowMCP 0.0.10)

- Immutable commit: `8a936de61b5f9f2fdff671b65b5384259267350b`
- Product version on fixtures: `0.0.10`

| EnginePort surface | Canonical source | Notes |
| --- | --- | --- |
| `startTask` → accepted | `contracts/v1/ctl-launch-run-accepted.json` | `result.task_id` |
| `startTask` → refused | `contracts/v1/ctl-launch-run-refused.json` | `code` + `reason` (from `error.code` / message) |
| `startTask` → unknown | `contracts/v1/ctl-launch-run-unknown.json` | `unknown` envelope; no auto-retry |
| Backend capability facts | `contracts/v1/ctl-backend-qualification.json` | Discovery/qualification shape; harness menus here are **fixture presentation data**, not a claim of installed binaries |
| Task catalog / sidebar rows | Design specimen mock data | **Mock-only presentation** — not a public ctl list endpoint invented for the browser |
| Workflow definition list | Design `workflows/list` + `workflows/empty` specimen copy | **Mock-only presentation** — not a public ctl workflow catalog; no run status |
| Workflow run form | Design `workflows/run` Task, Goal, repository, saved orchestrator, and permissions preview | **Mock-only presentation** — session-local draft; final Run disabled; permission lines are fixture facts, not installed or qualified backends and not enforcement |
| Workflow editor preview | Design `workflow-editor/node-selected` graph, standalone strip, and inspector | **Mock-only presentation** — read-only; two mapped definitions; editing, save, delete, connect, and run stay disabled |
| Workflow run graph | Design `workflow-run/graph-needs-you` and `workflow-run/on-demand`, with the publish request and Call 2 model adapted to `needs-you/waiting` | **Mock-only presentation** — one mapped run id, distinct from the Nightly definition id; branch, requester, repository, and publish action come from the shared Nightly snapshot; Security reviewer selection is presentation state and does not change the observation's selected node; Close returns to the Open pull request detail; a missing or mismatched node id shows that default detail; Pause, Cancel, Approve, Reject, goal edits, the node composer, and Open task stay disabled; Parallel, recovery, and the later locked Orchestrator strip card are omitted |
| Resources slot observation | Design `resources/slots` specimen copy | **Mock-only presentation** — not a public ctl resources catalog; no install/release/admin |
| Statistics overview | Design `statistics/overview` specimen copy + distinct 7-day mock range | **Mock-only presentation** — not a public ctl statistics/billing API; success rate and median are fixture facts only when coverage is complete |
| Running-task transcript | Design `task/running` specimen copy | **Mock-only presentation** — not a public ctl transcript protocol; mapped fixture ids only |
| Failed-task transcript | Design `task/failed` specimen copy | **Mock-only presentation** — explicit failed status; no running chrome; Retry/Copy resume unavailable |
| Completed-task transcript | Design `task/done` transcript+summary copy | **Mock-only presentation** — fixture evidence only; tool success ≠ verified authorship |
| Completed-task Changes | Design `task/done` Changes pane file list + selected diff | **Mock-only presentation** — recorded repository observations; not Git/fs; not authorship proof; independent of task success |
| Settings general | Design `settings/general` specimen copy | **Mock-only presentation** — shared session appearance only; behaviour/runtime/store unavailable or static facts; not persisted |
| Settings harnesses | Design `settings/harnesses` and `settings/mcp-approvals` | **Mock-only presentation** — independent fixture facts; the disclosure shows that harness’s list only; unknown or missing approvals stay unavailable; no PATH probe, install, registration change, or approval edit |
| Needs you waiting | Design `needs-you/waiting` approvals and one question | **Mock-only presentation** — fixture requests, not this computer; the Nightly publish card uses the same snapshot as the run detail; exact-action labels; no approval authority |
| Needs you empty | Design `needs-you/empty` | **Mock-only presentation** — complete coverage and zero items only; unknown is not this state |
| Repository options | Mock-only | Future server-hosted repos; not filesystem pickers; not ctl |

### Statistics semantic gaps (explicit)

- There is no accepted public ctl statistics contract in this slice. Totals,
  success rate, median duration, agent time, and reported cost are **fixture
  facts** for review, not computed engine semantics.
- Success rate and median duration are **suppressed** when coverage is
  incomplete; the client does not derive them from partial populations.
- “All time” cannot present retained mock history as all-time history; the All
  time selection uses incomplete coverage with an explicit retained-window note.
- Missing cost (`unavailable`) stays distinct from observed zero cost. Cost is
  never inferred from token counts.
- Harness row labels are fixture presentation labels, not installed/qualified
  backend claims.

### Task transcript semantic gaps (explicit)

- There is no accepted public ctl transcript protocol in this slice. Blocks,
  tool summaries, and running labels are **fixture presentation** for review.
- Only sidebar rows with an explicit `mappedTaskId` open a transcript.
  Unmapped rows and synthetic launch-accepted ids stay unavailable — never a
  fallback to another task.
- Follow-up send, stop, cancel, retry, copy-resume, approval, steering, and
  resume remain unavailable; expanding tools is local UI state only. Failed and
  completed tasks omit Stop and working indicators entirely.
- Completed summary and tool results are **reported fixture evidence**. A done
  badge or passing tool body does not imply independently verified repository
  changes, artifact validity, or authorship.
- Changes pane rows and diffs are **recorded repository observations** for the
  mapped completed fixture only. They are independent of task success and are
  not Git, filesystem access, patch application, downloads, or authorship proof.
  Empty recorded diffs stay distinct from unavailable content. Default
  (null-path) observations keep accepting later updates after display selection
  resolves. Artifacts and Events remain unavailable. Loading / empty /
  unavailable changes treatments beyond the populated fixture are proposals.
- Loading / unavailable treatments are proposals, not approved specimens, and
  must not show task A’s content under task B’s title when switching
  running ↔ failed ↔ completed, nor a prior file’s diff under a new selection.

### Needs you semantic gaps (explicit)

- There is no approval authority in this slice. Approve, reject, and Send do
  not grant permission and do not submit an answer.
- Approval labels name one action. “Approve once” is the command card.
  “Approve this publish” replaces the specimen’s bare “Approve” so the label
  does not read as task-wide permission (coverage decision G-APPROVAL-WORDING).
- Questions are a separate item kind. The Nightly dependency audit running-row
  attention glyph is a general notice. It is not a Needs you item and it is
  not added to the badge.
- Commands, paths, and prompts are fixture copy. They are rendered as text.
- Complete coverage with zero items is the only “Nothing needs you” state.
  Loading, unavailable, and partial coverage are proposals without approved
  specimens. Partial coverage shows the known items plus an incomplete mark.
- Mapped Open task navigates to that task. The Nightly publish card’s Open
  run navigates to the mapped run graph and does not approve it. Unmapped
  Open task stays unavailable. The reply control is not a submitting form.

### Workflow run on-demand inspector (explicit)

- HarflowDesign `3643d083700be4032c93237813b573d04bab6ab1`
  `v2/scripts/screens-workflow-run.js` state `workflow-run/on-demand`.
  Hosted `https://design.harflow.dev/v2` was inspected for this state and is
  newer than the pin; the locked Orchestrator card visible there is from
  `acd63f9` and is not part of this screen.
- The inspector is fixture copy for `run-security-reviewer` on
  `run-nightly-dependency-audit` only. Selecting it keeps the graph visible.
  Close returns to the observation's Open pull request detail, including the
  approval card. The observation's `selectedNodeId` stays that path node.
- A same-run observation update keeps the presentation selection. Closing the
  run, or opening it again, clears that selection back to the observation
  default. A requested id with no matching standalone inspector on this run
  shows the observation's own detail. Call text stored under another node id
  is not shown. Call 1 has a row and no body. Only the highlighted Call 2
  body is rendered, and the rows are not controls.
- The on-demand specimen's Security reviewer meta is `2 calls`. This strip
  keeps the existing graph-needs-you fixture meta, `2 calls · one at a time`,
  so the shared label stays as it already is. The specimen's selected
  accessible name is `Security reviewer, on demand node, 2 calls, selected`.
  This screen keeps the existing name shape: `done, selected` when pressed
  and `done, not selected` otherwise, with `aria-pressed`.
- The specimen caption is `Call 2 · Codex · gpt-6 · HarflowMCP`. This screen
  uses the same model adaptation as the Open pull request detail:
  `Call 2 · Codex · gpt-6-astra · HarflowMCP`.
- Open task is a disabled button with the specimen link class. It has no
  `href`, so it cannot open the design's `#task/done` fixture. The composer
  textarea and send button are both disabled. The specimen disables send and
  leaves the textarea writable. The pip-audit row shows the command and
  `0:41` and has no output body.
- Docs checker stays disabled. No inspector state is approved for it.
  Parallel, recovery, Pause, Cancel run, Approve, Reject, Revise goal, and
  More actions stay disabled.

### Workflow run form semantic gaps (explicit)

- There is no workflow execution in this slice. The list Run control only
  opens the form for that definition id. The form’s Run control stays
  disabled and does not call `startTask`.
- An id with no fixture context is unavailable. The form does not borrow
  another definition’s title, task, goal, repository, or permissions.
- Task and Goal text are stored exactly as entered. “Task is required.” uses
  a trim check and is a proposal; the approved specimen is prefilled.
- “Sandboxed” is specimen wording on one fixture line. The visible caption
  says these labels are not installed or qualified backends and do not claim
  enforcement.
- Custom orchestrator stays unavailable. Loading, error, validation, and
  adaptive states have no approved specimen.
- New workflow and Describe one to an agent stay unavailable. List Edit opens
  the read-only editor preview described below. The run form still does not
  save or delete.

### Workflow editor semantic gaps (explicit)

- There is no definition mutation or workflow execution. Save, Discard, Delete
  node, Run, Edit with agent, More actions, zoom, add-node, and inspector
  fields stay disabled.
- Only Release checklist and Nightly dependency audit have editor fixtures.
  Another id, including one with a similar title, is unavailable and does not
  borrow a graph.
- The Release checklist specimen footer says “6 nodes · 1 on demand · Ready to
  save” and the top meta says “Unsaved changes · Revision 7”. This preview
  shows the counted path and on-demand nodes and “Revision 7” only. It does
  not claim unsaved changes or readiness to save.
- Zoom controls stay at the specimen 65%. The canvas scrolls, at the approved
  6px tertiary scrollbar, so the fixed scale does not clip End. More actions
  does not open a delete confirmation. Release checklist has no loop-back.
  The Nightly dashed loop returns to Audit lockfiles. Start has no input port,
  so the loop is not attached there.
- Routing follows HarflowMac `705ceb7befcbf7a7e8fc013b95e7269bac5cf39b`.
  `WorkflowConnectionRouter.swift`, `WorkflowCanvasGeometry.swift`,
  `WorkflowSharedDestinationRoutes.swift`, `WorkflowRouteCache.swift`, and
  `WorkflowConnectionRouterTests.swift` are byte-identical to
  `ff3763762073d99e3caa51748baf51290d0319e7` and have no uncommitted diff.
  Their last content commit is
  `b36bfae04aefec1afc9685f4891282a2d0f74ce7`. Snap spacing is 10, clearance
  is 10, the search stops at 5000 expansions, and the port radius is 5.25.
  Web clamps an approach that would leave the non-negative canvas.
  Scrollbar color and 6px thickness come from HarflowDesign
  `5b37a3d4d4d06b3d96c517cd384892e1ac6883cf` `v2/styles/m04-proposal.css`
  (tertiary at 72%). Mac overlay scrollers (`WorkflowScrollRow.swift`,
  last content `a2fa4465e1b9ce199bef2ea978898384168c35c3`, and
  `ScrollHoverReveal.swift`, last content
  `2ced66194878445bde152f1d50777cd0633bb868`) are the same bytes at this
  Mac commit, with an 8pt gutter and hover reveal. The browser keeps a
  visible thin scrollbar and keyboard scrolling instead of hiding the
  overflow.
- The orchestrator is locked, standalone, and has no edge. Selecting it opens
  the read-only inspector from HarflowDesign
  `3643d083700be4032c93237813b573d04bab6ab1`
  `v2/scripts/screens-workflow-editor.js` state `workflow-editor/orchestrator`:
  Agent, Instructions, and Limits. Release checklist uses that specimen’s
  harness, instructions, fallback, and limits (3, 20, 5, 4, 100). Nightly
  dependency audit uses the same section chrome with its own fixture
  instructions and limits (2, 12, 1, 2, 40); the design state does not
  specify a second orchestrator. There is no delete control. Loading, error,
  and adaptive editor states have no approved specimen.

The mock adapter is not an HTTP protocol design and does not prove backend
compatibility.
