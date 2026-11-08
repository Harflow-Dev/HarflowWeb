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
- Centered New task composer amendment (owner-approved 2026-11-06), separate
  from the baseline `new-task/*` templates: HarflowDesign
  `9d64bfda7bed735d42c761c3149516c7f3e6ca01`
  `v2/docs/m04-centered-composer-proposal.md`,
  `v2/scripts/m04-proposal.js`, `v2/styles/m04-proposal.css`, states
  `m04-proposal/amendment-empty`, `amendment-ready`, `amendment-growing`,
  `amendment-capped`, `amendment-options`, and `amendment-unknown`. The
  greeting / composer / status / help group is centered. The prompt starts at
  one visual line, grows from `scrollHeight`, and caps at six lines then
  scrolls. The bottom-left `+` opens Task options (effort, turn limit,
  approvals) with a customized dot. Escape dismisses and returns focus to `+`;
  an outside click closes without moving focus there. Keyboard opening
  (`click.detail === 0`) moves focus to the first select; pointer opening does
  not. Placement is above or below from available compose-area space and is
  remeasured while open on viewport or compose-area resize. Pending and
  unknown outcomes disable Start and lock repository, harness, model, access,
  and option fields; unknown also refuses another launch. The compose status
  line is visual only; `StatusRegion` is the sole polite live region. Unknown
  specimen copy mentions Review Recent work; that action navigates to the
  design's `history-retained` board, which this mock does not implement, so
  the button is omitted. Option values are presentation state in this mock and
  are not sent on `startTask`. The plus control itself comes from HarflowDesign
  `bd5d349b9a4e068752fc071baf25782db0746a34`.
- Centered composer + sidebar redraw (owner-approved 2026-11-08), mock-only:
  HarflowDesign `854caae4d474536f84e6e911ff96d48c4ada008b`
  (frames identical to `19365d9`; `854caae` always disables the Unavailable
  harness option in `new-task/centered-harness-open` — see
  `v2/docs/decisions/README.md`), `v2/scripts/m04-proposal.js`,
  `v2/styles/m04-proposal.css`. Pinned routes: `new-task/centered-empty`,
  `centered-loading`, `centered-unqualified`, `centered-invalid`,
  `centered-starting`, `centered-refused`, `centered-options-closed`,
  `centered-harness-open`, and sidebar `sidebar/centered-collapsed`,
  `sidebar/centered-minimum` (`sidebar/expanded` and `sidebar/centered-expanded`
  redirect to `new-task/centered-empty` in Design). Qualification
  (`checking` | `ready` | `unqualified`) is observation-owned on
  `ComposerContext` and drives the Task options caption; Start stays disabled
  with “Choose a qualified harness and model.” when not ready.
  `centered-harness-open` uses the centred pill picker with labelled Harness and
  Model selects; “Unavailable harness” is selected and always disabled; the
  hint is linked with `aria-describedby`. Escape closes Task options only, not
  pickers. Refused status maps `Start was refused (${code}): ${reason}` from
  the ctl refuse outcome (brief authority over the specimen’s generic refuse
  line). Sidebar body (nav + Running + Recent) scrolls as one region; header
  and Settings/theme footer stay fixed. Minimum frame is the preview `1000×620`
  chrome.
- States implemented:
  - `new-task/centered-empty` (and prior `new-task/default`) light/dark
  - `new-task/centered-loading`, `centered-unqualified`, `centered-invalid`,
    `centered-starting`, `centered-refused`, `centered-options-closed`,
    `centered-harness-open` light/dark (mock scenarios)
  - `new-task/harness-menu/light` and `/dark`
  - `sidebar/centered-collapsed` and `sidebar/centered-minimum` light/dark
  - `new-task/sidebar-collapsed/light` and `/dark` (same rail as centered-collapsed)
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
| Workflow run graph | Design `workflow-run/graph-needs-you` and `workflow-run/on-demand`, with the publish request and Call 2 model adapted to `needs-you/waiting` | **Mock-only presentation** — one mapped run id, distinct from the Nightly definition id; branch, requester, repository, and publish action come from the shared Nightly snapshot; Security reviewer selection is presentation state and does not change the observation's selected node; Close returns to the Open pull request detail; a missing or mismatched node id shows that default detail; Pause, Cancel, Approve, Reject, goal edits, the node composer, and Open task stay disabled; the canvas zoom control stays disabled at 70% with its own explanation that this mock does not zoom; recovery and the later locked Orchestrator strip card are omitted |
| Workflow run Parallel | Design `workflow-run/parallel` at HarflowDesign `f2a30d7e625ae448588dc844e0dec16eb980eeee` | **Mock-only presentation** — Graph/Parallel is presentation state on the same Nightly observation; lanes and the orchestrator footer (`Orchestrator is choosing the next node…`, `Decision attempts: 1 / 3`) come from that observation only; missing or empty lanes fall back to Graph without borrowing and disable Parallel with its own explanation; close/reopen resets to Graph; lane composers, lane actions, Pause, Cancel, Approve, Reject, Revise goal, More actions, Zoom, and unmapped Open task stay disabled |
| Parallel group | Design `parallel-group/lanes` at HarflowDesign `17739e4` (`v2/scripts/screens-parallel-group.js`) | **Mock-only presentation** — Running sidebar row “Review preload bridge” (parallel glyph, meta `1/3`) opens `observeParallelGroup(groupId, …)` for that mapped group id only; top bar badge `1 running · 2 done`, enforcement meta, and three lanes (Claude Code / Codex / Opencode) come from that observation; missing group or empty lanes stay unavailable without borrowing; leave/reopen cancels the observation and resets; View prompt, Cancel all, lane actions, tool heads, and lane composers stay disabled with accessible explanations; working line is static (no fake clock) |
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
- HarflowDesign `f2a30d7e625ae448588dc844e0dec16eb980eeee`
  `v2/scripts/screens-workflow-run.js`, states `workflow-run/graph-needs-you`,
  `workflow-run/on-demand`, and `workflow-run/recovery`. The run canvas uses
  that bottom-right zoom control, labelled 70% because the graph is drawn at
  that scale. Zoom out and Zoom in stay disabled. Their explanation says this
  mock stays at 70%. It is not the Pause and Cancel explanation. The design
  control is present and is not marked disabled; neither changes the scale.
- Docs checker stays disabled. No inspector state is approved for it.
  recovery, Pause, Cancel run, Approve, Reject, Revise goal, and More actions
  stay disabled.
- Parallel view pin: HarflowDesign `f2a30d7e625ae448588dc844e0dec16eb980eeee`
  `v2/scripts/screens-workflow-run.js` state `workflow-run/parallel`. Lane
  titles and body copy follow that specimen. The specimen topbar shows
  Running / `Run started 02:00 · HarflowMCP`; this mock keeps the Nightly
  Needs you / `Step 2 of 4 · 06:31` observation chrome when toggling views
  (smaller change than inventing a second run status). Specimen lane model
  `Codex · gpt-6` is adapted to the Nightly snapshot `Codex · gpt-6-astra`.
  Lane titles stay the Parallel specimen names and are not rewritten to the
  graph node titles. The Parallel footer working line and decision-attempts
  caption are observation fields, not component copy. View mode is
  presentation-only; a same-run update keeps Parallel when lanes remain,
  otherwise falls back to Graph. Closing or reopening the run resets to Graph.
  A run without Parallel lane data disables the Parallel control with its own
  explanation rather than the Pause/Cancel text. `workflow-run/recovery` is
  not built.
- Parallel group pin: HarflowDesign `17739e4`
  `v2/scripts/screens-parallel-group.js` state `parallel-group/lanes`. Copy,
  lane bodies, and top-bar chrome follow that specimen. Shared tokens and
  component styles come from that same commit’s `v2/styles` (already vendored).
  The Running row maps to a Parallel group id, not the former preload task
  transcript. View prompt, Cancel all, lane actions, collapsed tool heads, and
  lane composers stay disabled. The running working line does not animate a
  clock or progress.

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
