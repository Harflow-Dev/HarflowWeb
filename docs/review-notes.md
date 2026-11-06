# Review notes — exploratory mock slices

## Intent

Review checkpoint after the read-only workflow editor preview (workflow run
form committed first). Does not complete W01–W05, authenticate,
connect a real engine, run workflows, administer slots, bill, submit
follow-ups, retry, apply patches, install a runtime, register MCP servers,
grant approvals, answer questions, or touch the task store.

## Known deviations

- Loading / unavailable / partial-sidebar treatments are **proposals** requiring
  design review; they are not approved specimens.
- Workflows/resources/statistics/task/harnesses/Needs you loading, unavailable,
  and partial copy are **proposals**, not approved specimens.
- Specimen copy “Choices are remembered per repository” is not implemented;
  selection is one global set for the mock session.
- Narrow-width layout is a responsive proposal; desktop specimens are approved at
  1280×800.
- Settings General is live. Appearance is the same session System/Light/Dark
  value as the sidebar and collapsed rail; it is not persisted. Behaviour
  switches are disabled specimen values with an accessible explanation; they
  are not saved preferences or notification settings. Runtime “0.9.3 is
  ready” and “Task store is compatible” are read-only specimen facts. Check for
  updates, Inspect task store, and Show backup in Finder stay unavailable.
  Settings → Harnesses shows fixture install, MCP registration, and
  qualification independently. Unknown does not become “not installed”,
  “not registered”, or “Ready”. Refresh, Update, and Remove stay disabled.
  MCP approvals expands and collapses that harness’s explicit fixture list.
  Add and per-entry Remove stay disabled and explained. Unknown or missing
  approvals do not render as an empty approved list. Specimen paths and
  readiness sentences are not this computer.
  No install, store, notification, credential, PATH, or OS settings.
- Needs you waiting shows the three fixture approvals and the question. The
  publish action reads “Approve this publish” (exact action; specimen “Approve”
  is not used). Approve, Reject, Send, and reply stay disabled. The Nightly
  publish card’s Open run opens the mapped run screen and does not approve
  it. That card and the run detail share one snapshot: branch
  `deps/audit-2026-11-03`, Codex · gpt-6-astra, HarflowMCP, and the same
  publish action. The graph specimen’s branch, model, and “on HarflowMCP”
  wording are adapted to that request. Leaving the run cancels its
  observation. The next Workflows click shows the list. Editor and form
  drafts stay. Every graph node’s status and selected state are in a list.
  Unmapped Open task stays disabled. Mapped Open task navigates to that
  task and does not start one. The empty state is complete coverage with zero
  items.
  Loading and unavailable do not say nothing needs you and do not show a zero
  badge. Partial coverage shows known items with an incomplete mark. The
  Nightly row’s attention glyph is not counted. No approval authority, answer
  submission, clipboard, provider, filesystem, or engine access.
- Sidebar destinations outside New task, Workflows, Resources, Statistics,
  Settings, Needs you, and explicitly mapped running-task rows stay unavailable.
- Workflow list Run opens the selected definition’s run form. The form shows
  that definition’s title, a required Task, an optional Goal disclosure,
  repository selection, the saved orchestrator, and a permissions preview.
  Drafts are session-local and isolated per definition. Final Run stays
  disabled and explained. Unmapped ids show unavailable and no borrowed form.
  Custom orchestrator stays unavailable. Permission lines are fixture facts;
  a visible caption says they are not installed or qualified backends and do
  not claim enforcement. “Sandboxed” remains the specimen limit label.
  “Task is required.” is a proposal shown only for a seeded blank task.
  Loading and error copy are proposals. No execution, save, delete,
  provider, engine, or filesystem action.
- Workflow list Edit opens the mapped definition’s read-only graph,
  standalone strip, and inspector. Release checklist selects Review.
  Nightly dependency audit selects Audit lockfiles. Its dashed loop returns
  to Audit lockfiles; Start has no input, so the loop is not attached there.
  Routes are orthogonal, with 10-point corners clamped to the segment, open
  chevrons, and no negative trunk. The canvas scrolls at 65% so End is
  reachable. The canvas and inspector use the 6px tertiary scrollbar.
  The orchestrator is locked, disconnected, and has no delete control.
  Selecting it shows the approved Agent, Instructions, and Limits sections
  with fixture values and disabled controls. Release uses the specimen
  values. Nightly uses a separate fixture. Selecting
  another node updates the inspector. A removed or unknown node stays
  unavailable and is not replaced by a similarly titled node. Unmapped
  definitions show unavailable and no borrowed graph. Save, Discard, Delete
  node, Run, Edit with agent, More actions, zoom, add-node, and inspector
  fields stay disabled and explained. The specimen phrases “Unsaved changes”
  and “Ready to save” are omitted. The footer counts path nodes and on-demand
  nodes. Opening the editor does not clear run drafts or other session state.
  Loading, error, and adaptive editor states are proposals.
- New workflow, “Describe one to an agent”, Resources task links,
  Install, follow-up send, Stop (running only), Retry, and Copy resume command
  are visible per design and explicitly unavailable in this slice — no
  admin or steering screens, no generated shell commands, and no
  mutation from those controls.
- Workflows list shows definition title, description, and node count only — no
  invented run status (matches screen-inventory note).
- Resources shows slot usage, holders, and waiters only — no over-limit,
  permission-denied, unsupported, release, repair, or configuration semantics.
- Statistics shows fixture overview totals for typed ranges only. Success rate
  and median duration are fixture facts when coverage is complete. Incomplete
  coverage is sanitized in presentation so reported success/median cannot reach
  the UI. There is no public ctl statistics contract in this slice.
- “All time” uses incomplete retained-history coverage rather than inventing
  all-time engine totals (retained history ≠ all-time).
- Running-task view implements `task/running`: slim header, transcript,
  expandable tools, working indication, follow-up composer shell with Stop.
- Failed-task view implements `task/failed`: failed badge, diagnostic transcript,
  failure explanation banner; no running badge, working indicator, or Stop.
  Retry / Copy resume / follow-up send stay unavailable.
- Completed-task view implements `task/done` transcript + summary + **read-only
  Changes pane**: done badge, diagnostic transcript, Summary separator/body,
  follow-up send unavailable; no Stop, failure banner, or Retry. Toggle opens
  the Changes pane with fixture file rows, counts, selected path, and literal
  diff lines. File selection keeps the list mounted and clears the prior diff
  while the new observation loads. Navigating to another task closes the pane
  immediately (no unclosable open pane on running/failed). Artifacts and Events
  tabs announce unavailable. No Git, patch apply, edit, download, or external
  links.
- Summary, tool outcomes, and Changes diffs are fixture-reported / recorded
  observations only; they do not claim independently verified authorship or
  working-tree proof. Change evidence is independent of task success.
- No task-level Summary/Prompt tabs, product search, or artifact browser.
  Needs you shows approval and question cards only. The workflow run form is
  a mock draft screen; its Run control does not start a run.
  More-actions chrome remains omitted.
- Only rows with `mappedTaskId` open a transcript. Synthetic launch-accepted ids
  remain unmapped unless an explicit fixture exists.
- Product search is deliberately omitted (coverage ledger: remove product search /
  sidebar harness filter). Statistics range selection is retained. Task-level
  Summary/Prompt tabs remain removed (prompt is the first transcript message).
- Accepted submission reports a synthetic task id in the status region only.
- Hosted design site may include material newer than pinned commit `3643d083…`.
- `migration-coverage.md` missing at the pinned design commit.
- Prior Workflows screenshots named `*-1280x800.png` under
  `~/.codex/workflows/screenshots/2026-11-05-harflowweb-workflows-slice/` are
  actually **1150×1360**; verified 1280×800 captures live in that directory’s
  `verified-1280x800/` subdirectory (see `docs/visual-validation.md`).

## Unresolved questions

- Exact public ctl projection for repositories, workflow definitions,
  resource/slot observation, statistics aggregates, and task transcripts on a
  future server.
- Whether harness fixture labels should track live backend qualification names or
  remain design specimen copy.
- Adaptive browser states for loading/error need owner-approved v2 specimens
  before claiming design fidelity.
- Whether not-installed Install should remain visible-but-unavailable or wait for
  an approved install flow before appearing in product Web.
- Accepted engine semantics for success rate, median duration, and reported cost
  once a public statistics contract exists.
- Whether a later slice should restore specimen right-pane toggles as unavailable
  chrome or wait for an approved Changes/Artifacts design.
- Settings persistence, behaviour preferences, runtime updates, and task-store
  actions remain out of this slice.

## What this does not claim

Production readiness, authentication, real engine compatibility, workflow
execution/editing, slot administration, billing accuracy, follow-up/retry
execution, Linux runtime support, or migration-gate completion.
