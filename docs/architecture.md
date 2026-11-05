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

- route (`new-task` | `workflows` | `resources` | `statistics` | `task`)
- new-task child session (draft, selections, appearance, sidebar collapse, launch)
- workflows child session (definition list observation)
- resources child session (slot observation)
- statistics child session (selected range + range-scoped observation)
- task child session (selected task id + transcript observation + optional
  Changes-pane observation keyed by task and selected file path)

Navigating does **not** dispose any child. In-flight launches keep applying;
returning to New task shows the current pending/accepted/refused/unknown state
without resubmitting. Statistics range selection and the selected running-task
identity survive navigation. Appearance and sidebar collapse live on the
new-task session and remain shared chrome for all routes.

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
- `observeResources(onUpdate) → ObservationHandle` — harness slot usage observation
- `observeStatistics(range, onUpdate) → ObservationHandle` — range-scoped overview
- `observeTask(taskId, onUpdate) → ObservationHandle` — running-task transcript
- `observeTaskChanges(query, onUpdate) → ObservationHandle` — recorded changes
  for an explicit task + selected path
- `startTask(request) → Promise<StartTaskOutcome>` — accepted | refused | unknown
- `ObservationHandle.cancel()` — dispose outstanding observations

No shell commands, generic RPC, or “call operation” methods. Workflows are
definitions (title, description, node count) — not runs and not run status.
Resources are read-only slot observation (usage, holders, waiters) — not
administration, install, release, repair, or configuration. Statistics are
read-only overview observations for an explicit typed range — not billing,
filesystem, or invented engine metrics. Task transcripts are mock presentation
evidence for an explicit task id — not a public ctl transcript protocol, and
not follow-up / cancel / retry / copy-resume / approval / steering commands.
Task changes are mock recorded-repository observations — not Git, patch apply,
downloads, or a public ctl diff protocol.

Each page observation uses an independent epoch so disposed or replaced
callbacks cannot mutate presentation state after cancel/replace. Changing the
statistics range, selected task, or selected change file cancels the prior
observation, clears into `loading` immediately, and rejects late responses for
any other key. Switching task A → B never keeps A’s transcript or diff under
B’s title.

## Future production path (not implemented)

Browser → authenticated Web server → public `harflow-ctl`. The browser never
invokes ctl, agent MCP, or engine SQLite/private files directly.
