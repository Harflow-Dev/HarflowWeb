# Architecture map — exploratory mock slices

## Layers

| Layer | Responsibility | May depend on |
| --- | --- | --- |
| `src/model` | Pure values, ids, outcomes | nothing |
| `src/application` | `EnginePort`, use cases | model |
| `src/presentation` | Presenters + immutable screen state | application, model |
| `src/components` | Presentational React | model, presentation types |
| `src/features` | React composition + presenter lifetime | presentation, components, application interfaces |
| `src/adapters/mock` | Deterministic `EnginePort` | application interfaces, model |
| `src/composition` | Wires mock → use cases → presenter | all (sole concrete adapter construction) |

Public entry points are each layer’s `index.ts`. Deep imports across layers are
avoided; `scripts/check-architecture.mjs` fails on forbidden directions, mock
imports outside composition, and I/O/React in pure layers. Size limits: target
250 / max 400 substantive lines per file; target 50 / max 80 per function.

A green import check does **not** prove semantic architecture correctness.

## App shell

`AppPresenter` / `AppSession` owns:

- route (`new-task` | `workflows` | `resources` | `statistics` | `task` | `needs-you` | `settings`)
- new-task child session (draft, selections, appearance, sidebar collapse, launch)
- workflows child session (definition list, plus a session-local run draft per definition and a read-only run-context observation)
- workflow-editor child session (read-only definition graph and a selection remembered per definition id)
- resources child session (slot observation)
- statistics child session (selected range + range-scoped observation)
- task child session (selected task id + transcript observation + optional
  Changes-pane observation keyed by task and selected file path)
- settings section (`general` | `harnesses`) plus a read-only harness
  observation (install, MCP registration, and qualification stay independent)
- Needs you child session (read-only approvals and questions). The sidebar
  badge is derived only from this observation. A running-row attention glyph
  is not an item and is not added to the count. Context `needsYouCount` is
  not the badge.

Navigating does **not** dispose any child. In-flight launches keep applying;
returning to New task shows the current pending/accepted/refused/unknown state
without resubmitting. Statistics range selection, the selected task,
the Settings section, and appearance survive navigation. Appearance and
sidebar collapse live on the
new-task session and remain shared chrome for all routes, including the
Settings theme control. There is one appearance value.

Only sidebar rows with an explicit `mappedTaskId` call `openTask`. Unmapped rows
(and synthetic launch-accepted ids without a fixture) stay unavailable and never
fall back to another task’s transcript. Task observations carry an explicit
`status` of `running`, `failed`, or `completed`. Failed/completed observations
must not reuse running badge, working indicator, or Stop chrome. Completed
summary text is fixture-reported evidence inside the transcript — not proof of
independently verified diffs, artifacts, or authorship. Changes pane content is
a separate recorded-repository observation (not Git, not authorship proof) and
stays independent of task success. The changes observation query path (`null` =
fixture default) is kept distinct from the resolved display selection, so later
updates on the same default observation remain accepted. Switching task closes
the Changes pane and clears retained file rows; selecting a file keeps the file
list mounted while clearing the prior diff under the new identity. Stale
callbacks are rejected by task, query path, and generation.

Sidebar chrome is split across `sidebarNav.tsx`, `sidebarSections.tsx`, and a
thin `Sidebar.tsx` shell so navigation growth does not pile more responsibilities
onto one file. Task UI is split across `TaskMain`, `TaskPage`, `TaskTranscript`,
`TaskFailureBanner`, `TaskSummarySection`, `TaskChangesPane`, and `TaskFollowUp`.

## EnginePort (slice-sized)

- `observeContext(onUpdate) → ObservationHandle` — composer + sidebar load
- `observeWorkflows(onUpdate) → ObservationHandle` — workflow definition summaries
- `observeWorkflowRun(workflowId, onUpdate) → ObservationHandle` — read-only
  run-form context for that definition. An unmapped id is unavailable and is
  never filled with another definition. Permission lines are fixture facts.
- `observeWorkflowEditor(workflowId, onUpdate) → ObservationHandle` — read-only
  graph for that definition. An unmapped id is unavailable and is never filled
  with another definition. Node selection is presentation state and is kept
  only while that node remains in the current definition.
- `observeWorkflowExecution(runId, onUpdate) → ObservationHandle` — read-only
  running graph for that run id. A workflow definition id is not a run id.
  An unmapped or mismatched payload is unavailable and is never filled from
  another run. Pause, cancel, and approval stay disabled.
- `observeResources(onUpdate) → ObservationHandle` — harness slot usage observation
- `observeStatistics(range, onUpdate) → ObservationHandle` — range-scoped overview
- `observeTask(taskId, onUpdate) → ObservationHandle` — running-task transcript
- `observeTaskChanges(query, onUpdate) → ObservationHandle` — recorded changes
  for an explicit task + selected path
- `observeHarnesses(onUpdate) → ObservationHandle` — fixture installation,
  MCP registration, qualification, and per-harness approval facts. None is
  derived from another. Unknown stays unknown. Missing approvals are not an
  empty list.
- `observeNeedsYou(onUpdate) → ObservationHandle` — approvals and questions
  only. Complete coverage with zero items is the empty state. Unknown or
  unavailable coverage is not zero and is not “nothing needs you.” Partial
  coverage stays explicit.
- `startTask(request) → Promise<StartTaskOutcome>` — accepted | refused | unknown
- `ObservationHandle.cancel()` — dispose outstanding observations

No shell commands, generic RPC, or “call operation” methods. The workflow list
is definitions (title, description, node count) — not run status. The run form
edits a session-local draft for one definition id. It does not execute, save,
delete, or edit the definition. Final Run stays disabled. The editor
preview renders one mapped definition’s nodes and edges. It does not save,
delete, connect, drag, add, or run. Opening it does not clear run drafts.
A loading observation clears the previous graph. A ready payload whose
definition id does not match the requested id is rejected before publish.
A selected node that disappears stays selected as missing; another node is
not substituted. Replacing or disposing the observation rejects a captured
callback. Editing controls stay disabled. Connector geometry is a pure
presentation router: it reads the current node frames and already routed
edges, and it does not mutate the definition. An edge whose source has no
output or whose target has no input is reported unavailable. The canvas and
inspector scroll with the shared thin scrollbar; scrolling does not change
selection. The locked orchestrator inspector is read-only fixture data for
that definition. It has no delete control and no edge.
Resources are read-only slot observation (usage, holders, waiters) — not
administration, install, release, repair, or configuration. Statistics are
read-only overview observations for an explicit typed range — not billing,
filesystem, or invented engine metrics. Task transcripts are mock presentation
evidence for an explicit task id — not a public ctl transcript protocol, and
not follow-up / cancel / retry / copy-resume / approval / steering commands.
Task changes are mock recorded-repository observations — not Git, patch apply,
downloads, or a public ctl diff protocol. Harness settings are mock fixture
facts — not a host PATH/filesystem probe, not install/register/remove, and not
approval edits. MCP approvals only expands the selected harness’s explicit
fixture list. Unknown or missing approvals stay unavailable. A loading or
unavailable harness observation replaces
the previous ready facts. Replacing or disposing the observation rejects a
captured callback. Needs you is the same shape: loading replaces a previous
ready or empty claim, and a captured callback after replacement or disposal
cannot restore it. Approve, reject, and answer stay disabled. Mapped Open
task calls the existing `openTask` navigation and does not start a task.
Unmapped Open task stays disabled. The Nightly Needs you item’s Open run
opens that mapped run id and does not approve the publish. The Needs you
card and the run detail read one publish snapshot for the branch, requester
and model, repository, and publish action. Leaving the workflows route, choosing Workflows again, or opening a mapped
task cancels that run observation and rejects a late callback. Editor and run-form drafts stay as they were. The graph exposes
every node’s status and selected state in a list; the drawn canvas is
presentational.

Opening a workflow Run from the list sets `runWorkflowId` and observes that
id. The previous context is cleared to loading before the next result arrives.
A callback is applied only when it matches that definition id and observation
generation. A ready payload is also rejected when `context.workflowId` is a
different definition, before any draft is seeded. Disposal rejects a captured
callback. Restarting the session reobserves the retained run, clears that
context to loading, and keeps the draft text and choices. Drafts stay keyed by
definition id, so switching definitions does not copy task, goal, repository,
or override. Collapsing Goal keeps its text. Task validation checks trimmed
length and does not write the trimmed string back. An unsupported override
is ignored. Permission facts are returned only when the selected repository
is still in the context and the selected override is currently available.
A removed repository, a disabled override, or a missing permission tuple shows
unavailable permissions and does not replace the draft's choice.

Each page observation uses an independent epoch so disposed or replaced
callbacks cannot mutate presentation state after cancel/replace. Changing the
statistics range, selected task, or selected change file cancels the prior
observation, clears into `loading` immediately, and rejects late responses for
any other key. Switching task A → B never keeps A’s transcript or diff under
B’s title.

## Future production path (not implemented)

Browser → authenticated Web server → public `harflow-ctl`. The browser never
invokes ctl, agent MCP, or engine SQLite/private files directly.
