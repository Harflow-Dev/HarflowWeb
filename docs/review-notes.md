# Review notes — exploratory mock slices

## Intent

Review checkpoint after the read-only workflow editor preview (workflow run
form committed first). Does not complete W01–W05, authenticate,
connect a real engine, run workflows, administer slots, bill, submit
follow-ups, retry, apply patches, install a runtime, register MCP servers,
grant approvals, answer questions, or touch the task store.

## Known deviations

- Approved first-load skeletons at Design `9d19fd7` are implemented for every
  mirrored screen that already exists in this mock (see
  `scenarioCatalogLoading.ts`). Unavailable and partial-sidebar treatments
  remain **proposals**. Needs you loading stays main-pane only for the
  1280×800 specimen (no full Design `SB`); its 1000×620 companion is
  `needs-you/loading-minimum`.
- Approved 1000×620 minimum-window states from Design `246cc97` are
  implemented for Needs you, Parallel group, Workflow run Parallel, and
  Workflow editor (node-selected + orchestrator), plus their loading
  companions (see `scenarioCatalogMinimum.ts`). Layout rules are responsive
  (main ≤ 800px / preview minimum frame): lanes keep a 360 floor, inspector
  is 288, top-bar meta drops to a focusable named dot, canvas scrolls. Normal
  1280×800 presentation is unchanged.
- Narrow rules are one CSS container query on `.hd-main` (`max-width: 800px`);
  lane sizing (320 floor wide, 360 narrow) lives in the `.hd-lane` class shared
  by loaded and skeleton lanes. Top-bar meta renders both forms and CSS picks
  one, so there is no JS width measurement and no flash of the wide form.
  With the sidebar collapsed at a 1000px window the main column is about
  952px, so the narrow rules do not fire there (by design: the approved
  minimum drawings show the expanded sidebar). The preview minimum frame
  always shows the sidebar expanded (main about 736px).
- Narrow inspector stacks the Instructions label above a full-width textarea,
  as the `workflow-editor/node-selected-minimum` drawing does. Known
  difference at every width: the drawing shows Turn limit as a label-left row
  and the Web Review node stacks it; the editor top bar already has More
  actions. Neither was changed here.
- Known: the production bundle is above 500 kB (Vite warning). No dependency
  or code-splitting change was made for it in this slice.
- **Skipped** approved states (out of scope or missing surface):
  `task/loading-pane` (no `task/pane-running-open`), `menu-bar/loading` and
  `menu-bar/busy-minimum` / `menu-bar/loading-minimum` (no menu-bar surface),
  task-screen minimum states, `task/artifacts-loading` and other
  `task/artifacts-*` (provisional), `sidebar/history-older` (Web has no
  sidebar history paging / “load older”; not built),
  `new-task/centered-loading` (separate first-load path already covered by
  `new-task-loading`), app-states / harness-runtime first loads, pending
  launches, and the four queued-message parallel-group lane states
  (`lane-messages-queued`, `lane-message-delivering`, `lane-message-uncertain`,
  `lane-message-cancelled`).
- **Follow-up (D21):** workflow-run Parallel view lanes were covered by the
  Design approval for lane decisions, but this Web slice does not change
  workflow-run Parallel; it keeps the existing `workflow-run/parallel`
  drawing. Apply titled lanes / Open task / Send-only there in a later pass.
- Parallel group titled family (Design `2153ab1` / `4ff7d83`): View prompt,
  lane menu, and the Cancel-all trigger are interactive; Cancel-all confirm,
  Send, Copy original request, and Load current activity stay unavailable (no
  mock mutation). Prompt disclosures reuse the task screen’s
  `hd-d2b-request` (Design drawing uses `hd-m05-request`). Legacy
  `parallel-group/lanes` keeps harness titles, findings end rows, and the
  shared 320pt wide floor; titled lanes use the drawing’s `flex: 1 0 360px`
  (`.hd-pl--titled`) so two lanes fill the width at 1280×800, and the
  `hd-main` container rule (`0 0 360px`, ≤ 800px) wins at narrow widths.
  The model carries no layout field: presentation derives the legacy layout
  from lanes without stored prompts (`parallelGroupTopBar`). This is an
  inference: a later `prompt: string | null` model, or retiring the legacy
  specimen, would remove the heuristic.
- Cancel all is shown only while a lane is running. A group with only pending
  lanes was not drawn, so whether it offers Cancel all is an open design
  question. The session also clears the Cancel-all dialog when a ready update
  leaves no running lane, so it cannot reopen later. `loading-two` is the
  two-lanes content under its own group id; loading reports an unknown count.
- Parallel group presentation derivations (review round 2026-11-13): badge
  tone, Cancel all, and View prompt availability are derived from lane
  statuses and prompts in `presentation/parallelGroupChrome.ts`; the empty
  copy lives there too (a ready group with zero lanes is the empty state).
  View prompt is unavailable, with an accessible explanation, for a group
  without stored prompts (legacy specimen, empty group). Open task is
  unavailable with an explanation on lanes with no mapped task. A loading
  observation carries `memberCount: number | null`; null (unknown) shows two
  skeleton lanes, and the `loading-two` scenario opens a group whose member
  count the mock deliberately reports as null. There is no non-deferred
  loading path.
- Cancel-all dialog (review round 2026-11-13): rendered by `AppFeature` inside
  `.hd-app` (scrim over the whole window, as in the drawing). The sidebar and
  main pane are `inert` while it is open; the lanes region is no longer
  separately inert. The trap uses focusable controls only (one control keeps
  focus on it for Tab and Shift+Tab). Focus returns to the Cancel all trigger
  in a `ParallelGroupView` effect after the commit that removes `inert`.
  Lane menu effect depends only on `menuOpen` (callbacks held in a ref) so a
  parent render never re-steals focus. Running lanes append the working row;
  settled, failed, cancelled, and taken-over Claude lanes use the full body
  from the drawing (opening, Read 6 files, finding, `rg` tool) without it.
- `new-task/centered-starting` is retired for
  `new-task/centered-starting-plain` (Design 76ad937): no visible status row
  under the composer while starting; Start’s accessible name is
  “Starting task”; “Starting task…” is announced once through `StatusRegion`.
- `task/changes-loading` and `task/events-loading` replace the former
  proposal “Loading changes…” copy. Busy regions use `role="group"` /
  `aria-busy` (not a second live region); Design’s pane `role="status"` is
  not mirrored. Changes "unavailable" and "empty" messages are plain text
  (no `role="status"`). Each loading phrase is exposed once: the group label,
  or the visible text, without a duplicate hidden `SkelStatus`. The diff-switch
  skeleton drops the `changes-text` designer caption. The Events full-pane
  skeleton keys on `history === 'loading'` only; a loading summary shows its
  own loading line beside available records.
- Submit no longer blurs the active element: Enter on an empty prompt or
  while Start is blocked keeps focus in the prompt (tests cover both). The
  `.hw-compose-status:empty` rule added with the starting state was removed;
  the row is omitted in JSX while pending and otherwise keeps its reserved
  height. Screenshots under `2026-11-12-harflowweb-starting-pane-loads/
  verified-1280x800/` show full-pane loading and the starting composer, which
  this round does not change visually (the removed caption only appeared in
  the diff-switch skeleton, which is not captured), so they are not stale.
- `settings/loading-general` is driven by a dedicated settings-general
  observation (`observeSettingsGeneral`: runtime readiness and task store
  compatibility, `'defer'` scenario value). The skeleton keeps the loaded
  page's sections, gaps and dividers, and the Appearance theme control is the
  same element in both states (no remount).
- **Deviation:** `settings/loading-mcp-approvals` draws the approvals
  placeholder under one expanded harness (the first row), not under every row
  as the Design drawing does, so it matches the loaded page where exactly one
  harness is expanded. The skeleton assumes the expanded harness is the first
  row, because placeholder rows are anonymous before data arrives. The
  expanded harness id is session state
  (`harnesses.expandedId`); the preview seeds it and it persists into ready.
- Task loading keeps the task title visible in the top bar when the sidebar
  row maps to it (owner decision); only the badge, meta and transcript shimmer.
- The Needs you sidebar count placeholder follows the Needs you observation's
  own load state, not the composer context. `sidebar-loading` and
  `new-task-loading` defer that observation to show the Design count slot.
- Loading skeletons mirror the loaded Web chrome where it differs from the
  Design drawing: workflow run top bar (segmented Graph/Parallel, Pause with
  icon, Cancel run, More actions), workflow editor top bar (More actions,
  icons, working Back), task top bar (disabled Toggle right pane), and five
  Resources cards (the loaded mock renders five harnesses).
- Busy skeleton groups carry a visually hidden loading label (plain text, not
  a live region). `StatusRegion` stays the single polite live region and
  announces the main screen's first-load label ("Loading workflows", …) from
  `features/mainLoadingLabel.ts`; its text changes when the screen enters and
  leaves first load.
- Settings General marks `aria-busy` only on the sections still loading
  (Behaviour, Harflow runtime, Task store); the Theme control stays usable.
- Specimen copy “Choices are remembered per repository” is not implemented;
  selection is one global set for the mock session.
- New task follows the owner-approved centered composer amendment
  (HarflowDesign `9d64bfd`): compact growing prompt, centered group, and `+`
  Task options. Effort, turn limit, and approvals are presentation-only; they
  gate Start with the specimen rules and are not sent on `startTask`.
- Narrow-width layout for the approved minimum-window screens follows Design
  `246cc97` / `cd606f0`. Other desktop specimens remain approved at 1280×800.
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
  observation. The next Workflows click returns to an editor or launch form
  that was already open, and shows the list only when neither is open.
  Editor and form drafts stay. Every graph node’s status and selected state are in a list.
  Unmapped Open task stays disabled. Mapped Open task navigates to that
  task and does not start one. Graph / Parallel toggles the Nightly Parallel
  lanes from the same observation (Design `f2a30d7` `workflow-run/parallel`).
  Topbar stays Needs you rather than the Parallel specimen’s Running chrome.
  Lane model `Codex · gpt-6` is adapted to `Codex · gpt-6-astra`. Lane actions
  and composers stay disabled. recovery is not built. The empty state is
  complete coverage with zero items.
  Main-pane loading uses the approved Design `9d19fd7` skeleton (title real;
  badge and cards placeholders; no proposal “Loading requests…” copy). It does
  not claim full sidebar `SB` or minimum-window acceptance. Unavailable remains
  a proposal. Loading and unavailable do not say nothing needs you and do not
  show a zero badge. Partial coverage shows known items with an incomplete
  mark. The Nightly row’s attention glyph is not counted. No approval
  authority, answer submission, clipboard, provider, filesystem, or engine
  access.
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
  First-load list skeleton is approved at Design `9d19fd7`; error copy remains
  a proposal. No execution, save, delete, provider, engine, or filesystem
  action.
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
  First-load editor skeleton is approved at Design `9d19fd7`; error and
  adaptive editor states remain proposals.
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
- First-load skeletons are approved at `9d19fd7`; adaptive/error browser
  states still need owner-approved specimens before claiming fidelity.
- Pixel-level light/dark captures at 1280×800 for every new loading scenario
  were not archived this slice; unit tests and `/preview` reachability cover
  behaviour. Re-capture under `docs/visual-validation.md` when storing PNGs.
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
