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
  `menu-bar/loading` and `menu-bar/busy-minimum` / `menu-bar/loading-minimum`
  (no menu-bar surface), other task-screen minimum states beyond
  `task/topbar-minimum` and `task/pane-overlay`, `task/artifacts-loading` and
  other `task/artifacts-*` (provisional), `sidebar/history-older` (Web has no
  sidebar history paging / “load older”; not built),
  `new-task/centered-loading` (separate first-load path already covered by
  `new-task-loading`), and app-states / harness-runtime first loads.
- **Parallel group queued messages** (Design `2153ab1`, owner approval
  2026-11-12): `lane-messages-queued`, `lane-message-delivering`,
  `lane-message-uncertain`, and `lane-message-cancelled` are reachable from
  `/preview`. Observed queue fields live on the lane (id, text, delivery,
  taskId); presentation derives caption, Cancel visibility, and the delivering
  outcome line. The cancelled outcome is seeded session chrome, fenced to the
  lane it names (the running lane), and resets on reopen. The `hd-m05-caption`
  rule is ported from `m05-proposal.css`; it also restyles the existing
  “Complete stored request” caption in the View prompt states. Cancel is shown where drawn but unavailable (no mutation). Queues
  render only when message `taskId` matches the lane `taskId`, and the
  cancelled outcome only for the lane whose id matches the seed (a lane with a
  task), even when its queue is now empty. There are no
  approved 1000 × 620 drawings for these four states; the existing narrow lane
  rules (360-point floor) still apply. Settled-lane queues and caller approvals
  remain out of scope.
- **Task screen queued messages** (Design `7de89a4`, owner approval 2026-11-15):
  eight `task/message-*` states are reachable from `/preview` (scenario id =
  design route id). The status `messages` ledger uses contract field names
  (records of another `target.task_id` are ignored; bubbles follow `seq`);
  uncertain stays `delivering` with a reason. `messaging.v1` is observed at
  engine level (`EnginePort.observeMessagingCapability`, like the pending-launch
  capability), not read from the task: available adds a disabled Send now on every
  running task; unavailable locks the
  composer (no placeholder, hint, or Send now). The mock default is available;
  `message-unsupported` seeds it unavailable. Cancel removes a queued message
  in the mock, focuses the outcome line (only in response to Cancel, never on
  remount), and announces through `StatusRegion` (the outcome paragraph is not
  a live region). Send now is drawn disabled with its title and has no mock
  behaviour. Shared presentation with Parallel lanes lives in
  `presentation/queuedMessages.ts`.
  Command outcomes are session chrome, not ledger facts: the send-now
  `refusal {code, message}` exists only on the send acknowledgement
  (`ctl-messaging-queued.json`), so it is held per message id and seeded for
  `message-send-now-refused`. "Message delivered." and "Queued message
  cancelled." are transient outcomes (Cancel sets the latter); the mock seeds
  them for `message-delivered` and `message-cancelled` because the contract
  offers no event-level outcome for the task screen, and retained terminal
  records (metadata only) never produce an outcome line. "Delivery is in
  progress." stays derived from a delivering record, as in Parallel lanes.
  Open contract gaps the design flags (approval does not close them):
  send-now refusal codes other than `interrupt_unsupported`
  (`workflow_checkpoint_required`, `continuation_refused`,
  `continuation_uncertain`) have no copy and draw no note; uncertain delivery
  uses neutral provisional wording; no settled-target note copy; unsupported
  has no copy. Further undesigned cases, drawn as nothing: the contract status
  `undeliverable` (superseded entries); a queued or delivering record without
  `text` (the contract makes text optional); messaging unavailable on a settled
  task (the composer there is unchanged).
- **Owner decision 2026-11-19: Send now on every running task when
  messaging.v1 is supported.** The approved running-task design states (e.g.
  `task/running-stop`, `pane-running-*`, `topbar-*`) predate this and draw no
  Send now; this is a known, accepted difference until the design is updated.
  Send now shows whenever the capability is ready and supported, regardless of
  the status `messages` ledger (the engine always emits it). While the
  capability is loading the composer stays unchanged (no flash of Send now).
  Settled tasks keep the standard composer without Send now. The approval-base
  drawing also predates that decision; approval scenarios keep Send now when
  messaging is ready (accepted difference, same as other running tasks).
- **Task screen approval states** (Design `56b49cb`, owner approval 2026-11-15):
  six `task/approval-*` scenarios are reachable from `/preview`. The ledger row
  uses contract field names; respond refusals (`not_current`, `already_answered`,
  `settled`, …) live in session chrome keyed by request id, never on the row.
  One model-level `isAwaitingDecision` (disposition and delivery pending, no
  decision, no system rejection) backs the card, the mock and the fixtures.
  Topbar Needs you badge and sidebar attention glyph follow
  `approval_summary.awaiting_decision_count` honestly (exact/stale = 1; the
  other four = 0). The drawings keep the Needs you badge on all six because
  only the card was replaced — that badge-count difference is intentional.
  The sidebar attention glyph of the open running task now follows the observed
  `awaitingDecisionCount` (the same fact as the topbar badge), so both clear
  together after an Approve or Reject. The scenario catalog no longer hard-codes
  the glyph. Applying an accepted or refreshed row replaces only the drawn row,
  and only when its request id is the currently observed one; the per-task count
  stays with the observation feed.
  Engineering decisions (owner-level, not design):
  - **D1. Channel.** The Web answers approvals through Monitor, like the Mac
    app. The mock's accepted response records `responder: monitor`,
    `decided_by: caller`, disposition pending, delivery reserved (the
    `ctl-approval-respond-monitor` shape). `responder` is a channel and never
    identifies a person.
  - **D2. “By you”.** “Approved by you” and “Rejected by you” come only from
    this browser session's own accepted acknowledgement, held in the approval
    chrome keyed by request id. They are never inferred from ledger fields; a
    decision found on the ledger alone (any responder) is drawn as facts.
  - **D3. Uncertain outcomes.** A respond that throws or times out (`unknown`),
    or a refusal with a missing or unknown reason, is non-actionable: the card
    shows the untyped line plus Refresh and never offers the decision buttons.
    The request id at that owner revision stays read-only for the life of the
    session chrome (it survives task switches), even after a successful re-read.
    A re-read returning a different owner revision or request id is decidable
    again. A failed or absent re-read keeps the existing refusal or
    non-actionable entry and shows nothing new. In-flight respond calls are
    keyed by task id + request id in the command object, so leaving and
    returning mid-call cannot submit twice, and Refresh is disabled and ignored
    while a respond is in flight.
  Open gaps (undrawn in Design `56b49cb`):
  - **Own-answer post-states.** After a successful Approve once the card head
    reads “Approved by you” (components/approval-card) with no lines. **Reject**
    (“Rejected by you”, with an `x` head icon) and the engine rows that follow
    an accepted answer, **reserved** (the mock's accepted state) and
    **sending**, have no approved route. Reserved and sending rows seen without
    a session answer draw the fact lines only (see below).
  - **Own-answer heads hide the source label.** “Approved by you” and
    “Rejected by you” omit the “Claude · Bash” source shown on the hand head;
    this is an undrawn choice. When the engine's effective decision differs
    from the recorded one, the head is followed by the fact lines.
  - **Refresh gives no feedback when it finds nothing or fails.** The card
    stays as it was; there is no design copy for that outcome.
  - **Fact-only rows.** Any non-awaiting row without a refusal or session
    answer (reserved, sending, sent-rejected, cancelled, invalidated,
    system-rejected) draws a result block of facts only (who/when when
    `decided_by` is `caller`, `Recorded decision`, `Delivery`, `Observed
    execution`) with no invented sentence and no Refresh. Refusal copy is never
    drawn without a refusal.
  - **Other typed refusal copy.** `expired`, `ownership_lost`, `unauthorized`,
    `unsupported`, `caller_undecidable`, `incomplete` and the untyped /
    unknown-reason / transport-uncertain state have no design copy. They use the
    HarflowMac lines verbatim (D4), from
    `HarflowMac/macos/HfFeatures/MainWindowFeature/Sources/MainWindowFeature/TaskDetail/CallerApprovalPresentation.swift`
    `refusalMessage`. Refresh is offered for every refusal except
    `already_answered`, `settled` and `expired` (Mac `canRefresh`).
    `ownership_lost` does not claim the ledger is unchanged.
  - **Answered elsewhere names only the channel.** The contract reports
    caller or monitor only — not surface, device, or person (design gap). The
    who/when line is drawn only for a human decision (`decided_by: caller`) and
    omits the channel when `responder` is absent (older rows).
- **Pending launches** (Design `83d820f` / approval `2934681`): all 21 approved
  `task/pending-*` states are reachable from `/preview`. The “Pending launches”
  nav item appears only when the mock engine reports capability
  `task-pending-launch.v1` (`pendingLaunchCapability: true` on those scenarios).
  Existing scenarios leave capability unsupported, so their sidebars stay
  unchanged. Sparse sidebar history in the drawings is specimen content only;
  this app does not truncate Running/Recent. Request Stop never mutates; stop
  outcomes are separate scenarios. Check again / Check next page / Check task
  status stay on the current fixture. Provisional queued-message and approval
  pending states, and `task/launch-unknown`, stay out of scope. Inventory rows
  follow the drawing (`title` / harness · repository · status / full ID); created
  time and resource names appear on the locked detail facts when qualified.
  Known drawing difference: `task/pending-stop-confirm` shortens the waiting
  card lead under the sheet to “Waiting for Claude slots and Shared checkout.”;
  this mock keeps the approved waiting sentence from the decision table while
  the sheet is open.
  Further deviations and gaps:
  - `task/pending-loading` skeletonizes the sidebar history rows too; Web keeps
    the real Running/Recent sidebar because it is a separate observation.
  - Design gap: the drawings have no state for a single launch ID whose status
    read is pending. This app shows the neutral top-bar title “Pending launch”,
    an aria-busy skeleton with no claim-bearing copy, and announces “Checking
    launch status” through the status region. Needs a Design state before it is
    treated as approved.
  - Unknown, missing, recorded, and handoff-failed details show only the
    “Selected ID” fact and the neutral title; a Stop outcome is presentation
    state seeded by the Stop scenarios; the preparing handshake renders no Stop
    control (the heading and lead carry the explanation).
  - A scenario's status fixture applies only to the launch ID it seeds; other
    IDs keep their own default status and an unknown ID reads as not found.
    The session rejects any ready status whose launch ID differs from the
    requested one.
  - Created time is formatted in UTC from a structured timestamp so previews are
    stable across viewer time zones.
  - Open item: the Created time is UTC with no zone label so the mock renders
    match the drawing. Before a real adapter, it must switch to the viewer's
    local time or show a zone label.
  - No invented copy: a waiting status without named resources and a
    not-started status without a stored reason render as “Launch status
    unavailable”.
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

- **M05 task status screen (mock-only).** Sixteen approved `task/*` states at
  Design `6e31cd7` render through `taskStatusView` + `TaskPage`. The 16 fixtures
  carry an observed `conversation` (stored request plus the design's
  `transcript(...)` rows), so `TaskPage` draws the M05 column (`columnHtml`):
  collapsed Original request, resource card, notice, rows and banner inside one
  scroller, centred at `--content-width`, with no speaker labels, history header
  or live strip. Notices sit between the request head and the first row; banners
  close the transcript content. The older transcript surface (Design `854caae`)
  remains for the D2B `task/transcript-*` scenarios and for tasks without a
  conversation. `StatusRegion` is still the only live region (the outcome banner
  is a labelled group). The meta line and `· N turns` come from presentation
  (`turnCount` > 1; hidden while pending); the badge clock is formatted from
  observed `elapsedSeconds`; launch-unknown is command chrome
  (`continue-unknown`, the outcome of a Continue command), not a task fact.
  The pending card is an observed `launchWait` fact mapped in presentation.
  Settling and unknown-done draw the design's done rows with its one-paragraph
  Summary; the old long `task/done` summary stays only on the Changes-pane
  fixture.
- **M05 G-OVERFLOW (mock-only).** Six approved overflow/dialog states at Design
  `6e31cd7` (`overflow-running`, `overflow-settled`, `overflow-subtask`,
  `cancel-dialog`, `cancel-dialog-lineage`, `takeover-dialog`) seed through
  composition. The M05 task top bar shows More actions; the approved
  transcript screens (`transcript-*`, with or without the Events pane) do not,
  because the design draws no More anchor there
  (identity `menu: false`). That is screen identity, not an engine
  observation: composition seeds `TaskScreenState.overflowAnchorOmitted` from
  the transcript scenarios, so the model carries no such flag. Without a
  recorded repository only the repository group (separator, label, Open in
  Finder, Copy path) is left out; nothing is invented. Menu items follow the
  observed-status availability map, including the stop-requested ("stopping")
  composer state (no Stop, no Take over, Open in terminal unavailable).
  Take over is offered only when the access level is observed
  (`accessLevel`); presentation maps it to the dialog label and nothing is
  defaulted, so an observation without it gets no Take over item and no
  dialog. Composer and banner Stop open the same Stop dialog; confirms stay
  unavailable. A dialog or open menu is dropped when the load leaves ready or
  the status no longer admits it, and the background is inert only while a
  dialog is actually drawn. Sub-task provenance is a transcript head line.
  The More button changes the previously approved M05 status screens, not the
  transcript screens (checked pixel-identical to the pre-slice build);
  recaptures live under
  `~/.codex/workflows/screenshots/2026-11-14-harflowweb-task-overflow-dialogs/`.
- **M05 G-DIFF (mock-only).** Fifteen approved Changes states at Design
  `6e31cd7` (`changes-single` … `changes-turns`) seed through composition.
  The pane follows repository → scope → rows with the engine attribution
  sentence, Provenance disclosure, tab-count rule, lifecycle overrides
  (pending / unread / running / inferred / settling / stored capture), and
  turn picker. Artifacts stays in the tab bar but is unavailable: that is a
  scope choice, not a contract gap (HarflowMCP has `task-artifacts.v1`,
  `docs/task-artifacts.md` and `ctl-task-artifacts-*` fixtures; the content
  design is provisional). Events is now an enabled tab (see M05 Events
  below). Confirms for Retry / Load more / Reload stay unavailable.
  Screenshots under
  `~/.codex/workflows/screenshots/2026-11-14-harflowweb-task-changes/`;
  tab-bar recaptures with Events enabled live under the Events slice folder.
  Transcript screens checked pixel-identical to `b60b2fc` / later `f1da745`.
  - **Model follows `task-changes.v1`.** Repository identity is its root (the
    name is derived in presentation); `observed_at` is stored as an instant
    and formatted in presentation; `unmerged_unknown`, `reported_conflicts`
    and `counts_and_patch_separate` exist on the working-tree scope only. A
    path that is not valid UTF-8 arrives as `path_bytes_b64` (path null);
    presentation draws the `\xNN` escape and the "Bytes, not UTF-8" label
    while the row content stays normal. The engine invents no repository
    reasons such as `reported_conflict`: the "Reported conflict" tag and the
    advisory caption come from the working-tree scope's conflict names, and a
    repository with a captured committed range and an uncaptured working tree
    is `available`.
  - **UI state is not observation.** No row is selected by default; the
    design's selected rows (single, row-states, turns, same-path, and the
    `task-done` / `task-overflow-settled` recaptures) are seeded chrome. So
    are the turn lineage (not a `task-changes.v1` fact), the stacked text-mode
    specimen panels, and the alternates repository drawn open in
    `changes-not-captured`. Display wording (scope label, "Read N of M
    stored", short task id `7be02d91`) is computed in presentation.
  - **Summary layout** starts at four repositories
    (`CHANGES_SUMMARY_LAYOUT_MIN_REPOSITORIES`). As the design draws it, it
    shows the attribution sentence once at pane level and hides each
    repository's Provenance disclosure, so Provenance is not reachable in the
    8-repository states; below four, attribution and Provenance sit inside
    each repository that has scopes. The tab-count caption shows only when a
    tab count is drawn. A repository count is not drawn under the
    complete-zero caption. A scope count gets "+" only for truncated rows.
  - **Incomplete fixture.** The design draws the working tree of
    `changes-incomplete` as available, zero rows, "Conflicts unknown". The
    fixture carries `unmerged_unknown: true` there. The contract's
    `ctl-task-changes-incomplete.json` has that scope `available` with
    `unmerged_unknown: false` (index read), so the design's tag is a state
    HarflowMCP's own fixture does not exercise; the contract allows it (a scope
    cut short before the conflict step) but no fixture covers it.
  - **Undesigned copy.** The unavailable-document body is chosen by
    `capture.reason` (`capture_too_large` is the drawn text; `capture_error` and
    `changes_document_invalid` are derived from the drawn reasons list and
    have no designed body; the older-engine usage error stays only in the
    drawn reasons list, because no model path produces it before the
    capability handshake exists). A
    `not_captured` capture with no repositories draws the not-observed note
    above the drawn reasons list; `capture_missing` wording is undesigned.
  - **Tabs.** The Changes pane tablist is a roving tablist over all three
    tabs (Left/Right wrap, Home/End; arrows move focus only) with a labelled
    `tabpanel`. Artifacts stays `aria-disabled`. Events is enabled and
    switches the panel (see M05 Events).
  - **Intended deviation: `changes-row-states` selection.** Web seeds
    `src/big_module.py` as the selected row (the design draws no selection but
    does draw that file's diff text), because Web needs a selection to show
    text. Row-states text compares equal to the design at the text level
    because the design also draws that diff.
- **M05 remaining deviations (honest list).**
  - Settling Changes copy is drawn when the lifecycle maps to settling (or
    the dedicated incomplete/settling capture); status fixtures that leave
    `detailsPane` null still have no default pane open.
  - Out of scope top-bar facts: the "Can edit this repo" enforcement chip,
    notice and continuity chips (facts groups live in the Events tab; chips
    remain a later slice).
  - Cancel-partial, continue-refused, and Artifacts *content* are not built
    (continue-refused is held on fixtures, owner decision question 5;
    Artifacts tab position is approved, content provisional).
  - "Copy original request", "Open resource slots", Continue, Copy resume
    command, Refresh, Check for a new task, Open Events and Retry read are
    `aria-disabled` with explanation ids and mutate nothing. Overflow confirms,
    Open in terminal, Open in Finder, and Copy resume stay unavailable. Stop
    opens the confirmation dialog; "Stopping…" and "Starting…" remain dimmed.
    "Open resource slots" is a button here, not a link.
  - Tool rows with output are native `<details open>` (collapsible); rows
    without output are static. The design draws inert buttons.
  - Badge clock beyond 59:59 (`h:mm:ss`) and the turn count below two are
    undesigned choices.
  - The task/loading skeleton pins its transcript box to 447 px, the
    running-stop transcript height, as the design does. The visible
    `StatusRegion` bar ("Loading task") overlays the composer in captures.
  - The D2B follow-up composer now follows the M05 composer at 854caae
    (placeholder "Queue a message…", the hint text, 88 px height). The earlier
    D2B captures used the retired `screens-task.js` placeholders; the
    recaptures are in `previously-approved-recaptures/`.
  - The send button is a disabled grey because it is unavailable in this mock;
    the design shows it active.
  - `task-done` opens the retry-budget task with the G-DIFF Changes pane
    (same capture as `task-changes-single`); recaptured with this slice.
  - Pixel fidelity to native is not claimed.
- **M05 Events tab (mock-only).** Seven approved Events states at Design
  `6e31cd7` (`events-populated` … `events-error`) seed through composition
  (`paneTab: 'events'`; `eventsLoadEarlier` asks for the older page once the
  read is ready). Lifecycle follows design `paneHtml`: pending (or the
  engine's `task_pending_launch` refusal) → notStarted; unread status →
  unavailable; otherwise the Events observation (or loading). notStarted and
  unavailable start no Events read. Facts groups are presentation disclosures
  over observed task facts; open/closed chrome and top-bar reveal chips stay
  out of scope.
  - Model uses contract names: `log.state`, `hasOlder`/`olderCursor`, record
    `seq` + `kind` + JSON text, and the enforcement block (`os_enforced`,
    `writes_confined`, `local_commit`, `publish_attempts_allowed`,
    `network_access`). Presentation maps kind to the record title (unknown
    kinds are public stubs) and enforcement values to the design labels.
    `mechanism` is engine free text shown as given; the specimen string
    stands in for it in the mock. Freedoms use the app's existing access
    labels (Read-only, Can edit this repo, Can publish, Full access). Labels
    for event kinds the design does not draw (e.g. Tool call) are undesigned
    wording.
  - Load earlier is a real older-page read ({task, `before` cursor} →
    page | `event_cursor_expired` | `event_cursor_invalid`), fenced by the
    Events epoch, task id and cursor. The session keeps `eventsEarlier`
    (idle | loading | loaded | error) with the older records read. "Reached
    its beginning" appears only after a read whose `hasOlder` is false; Load
    earlier stays while `hasOlder` is true. The page-error state is reached
    through a seeded transient (unavailable) older-page answer. A transient
    failure leaves the rows shown and offers a working Retry history read that
    re-issues the same cursor (fenced the same way); a cursor refusal
    (`failure: cursor`) never offers it and keeps the pre-design Reload from
    newest note (an unavailable command; undesigned). The reading position is
    kept with the transcript anchor helper.
  - Every approved task fixture answers Events from its status (running,
    owner lost, settling, unobserved exit and terminal states differ only in
    `log.state`; the display does not). Task fixtures with `detailsPane: null`
    still draw no right-pane toggle, so their Events body is reachable only
    through the session; a sweep test asserts notStarted / unavailable /
    ready for all 16 task-status fixtures.
  - Undesigned: an enforcement block with `recorded: false` shows only
    Requested and the engine's note as the caption; an absent `local_commit`
    omits its row. Continuity keeps the nullable `at` and the previous/current
    server fields in the model; no scenario shows them and no display is
    invented.
  - Task ID shows the 8-character prefix of the task id. The seven Events
    fixtures have distinct full ids that share the design specimen's prefix
    `7be02d91` (a single-specimen mock choice; ambiguous as a real lookup
    prefix), so the expanded-facts text matches the design with no
    normalisation.
  - Follow-up for the real adapter: when the newest page moves, poll
    `newer_cursor` instead of resetting older pages already read.
  - The page-error note sits inside the paging row as in the design; Events
    headings inherit the pane line height.
  Changes stays observed while Events is selected so the Changes tab count
  remains correct. Transcript `TaskEventsPane` bodies (including `/events`)
  stay byte-identical to `f1da745`; M05 Events CSS is scoped under
  `.hd-m05-events`. `TASK_OPEN_EVENTS_UNAVAILABLE_ID` remains for the
  failure-banner Open Events action. Screenshots under
  `~/.codex/workflows/screenshots/2026-11-15-harflowweb-task-events/`.
  Pane `innerText` matches design for all 7 Events (collapsed and with every
  disclosure open) and all 15 Changes states at 1280×800 light.
- Prior running / failed / loading sidebar captures were retaken: the 16 M05
  states plus `task-running`, `task-failed` and `task-loading` live under
  `docs/visual-validation.md`.
- **M05 G-ADAPTIVE + top bar (mock-only).** Nine approved states at Design
  `40b8a19`: `pane-running-closed`, `pane-running-open`, `pane-failed-closed`,
  `pane-split`, `pane-overlay`, `loading-pane`, `topbar-facts`,
  `topbar-resource`, `topbar-minimum`. Default pane open is a pure function of
  observed status (settling and a completed task with an observed exit open on
  Changes; running, failed, cancelled, timed out, inferred done and transcript
  Events routes stay closed). First open while running selects Events (an open during
  load resolves when the status arrives); later closes keep the tab. Pane open
  state and tab are remembered per task id for the session; a task never
  visited uses the status default. Split vs overlay uses the measured
  `.hd-main` detail width (>=900 split), measured synchronously. Structure
  mirrors the design: `main.hd-main.hd-m05-main` holds a full-width 44px bar
  (Option C grid, centred title group; chips, toggle, More at the right), then
  `.hd-m05-body` with the column and the pane as siblings. Only the column is
  `inert` while the overlay is open. Overlay Escape closes and returns focus to
  the opener (chip or toggle); it ignores defaultPrevented events and does
  nothing while a dialog or the More menu is open. Chips open Events, expand
  the matching facts group (re-clicking re-expands) and focus its summary.
  Turn count stays in meta and in Facts. At narrow detail widths (<=835, the
  design's frame < 1100 with the 264 sidebar) the bar drops the meta visually
  (kept once as hidden text, no dot) and chips compact; this breakpoint is
  independent of the 900 split rule. Held resource card reads the engine
  `resources` fields (`names`, `reservationId`, `state`, `grantedAt`); "Since
  Nm ago" is computed from `grantedAt` and `observedAt` (the adapter's read time of the status, not an engine field), and the
  line is omitted when either is unknown. The card shows `names[0]` only, as
  the design specimen does. The pane toggle keeps the design's Show/Hide labels
  with `aria-expanded`; it is not rendered when no pane can render
  (unavailable task). `loading-pane` keeps the real title when the listing
  knows it (known deviation, provenance.md) and otherwise follows the design.
  Events older-page failures: a transient read failure shows the design
  copy and a working "Retry history read" that re-reads the same cursor,
  keeps the rows and position; a cursor refusal (expired/invalid) follows the
  contract (reload from the newest page, never a same-cursor retry) and is an
  undesigned state that needs a design (its note and dead action are the
  pre-design copy). Screenshots under
  `~/.codex/workflows/screenshots/2026-11-15-harflowweb-task-pane-topbar/`.

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
