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
- First-load skeletons (owner-approved 2026-11-08), mock-only, Design pin
  `9d19fd70cc385c551004db4a8054cc85dc93fe86`. Shared primitives:
  `v2/scripts/skeleton.js` at `ba8c9280e817cb8d634bf0cbaaf6fa8f94824931`,
  `v2/scripts/skeleton-specs.js` at `9d19fd7…`, `v2/styles/skeleton.css` at
  `8f52ad3e5931e6bd8ea52842ba84968f194f8ca9` (shimmer + sheen tokens in
  `src/styles/`). State registrations (last change at or before the pin):
  - `v2/scripts/screens-loading-work.js` @ `9d19fd7…` —
    `new-task/loading`, `sidebar/loading`, `task/loading`,
    `parallel-group/loading` (`task/loading-pane` skipped; no
    `task/pane-running-open` mirror in this mock).
  - `v2/scripts/screens-loading-more.js` @ `9d19fd7…` —
    `needs-you/loading`, `workflows/loading`, `workflow-editor/loading`,
    `workflow-run/loading`, `workflow-run/loading-parallel`,
    `resources/loading`, `statistics/loading`, `settings/loading-general`,
    `settings/loading-harnesses`, `settings/loading-mcp-approvals`
    (`menu-bar/loading` skipped; no menu-bar surface).
  Needs you 1280×800 loading remains main-pane scope only (no full Design
  `SB` sidebar-data skeleton). The `246cc97` minimum-window companions are
  listed under Minimum window below. Observed checks and remaining visual
  limits are in `docs/visual-validation.md`.
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
  line is visual only; `StatusRegion` is the sole polite live region (it also announces the main
  screen's first-load label; skeleton labels are plain hidden text). Unknown
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
  `centered-refused`, `centered-options-closed`,
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
- Starting without a status row (owner-approved 2026-11-09): HarflowDesign
  `76ad937038924ee9b7d2b37f045c458c3b5e3091`, drawing in
  `v2/scripts/m04-proposal.js` @ that commit, state
  `new-task/centered-starting-plain`. Retires `new-task/centered-starting`.
  No visible row under the composer while starting; Start’s accessible name is
  “Starting task”; “Starting task…” is announced once through `StatusRegion`.
- Task Changes / Events partial loads (M05 task-screen approval): drawings in
  `v2/scripts/screens-m05-proposal.js` and `v2/scripts/m05-proposal.js` @
  `6e31cd7f4a7b63beb329c6a4b4d79ca5eef57863` (approval record
  `v2/docs/decisions/m05-task-screen-approval.md` at the same commit); routes
  `task/changes-loading` and `task/events-loading` (aliases
  `m05-proposal/changes-loading`, `m05-proposal/events-loading` in
  `v2/docs/route-map.md` @ `76ad937…`). Mock preview scenarios
  `task-changes-loading` (deferred `observeTaskChanges`) and
  `task-events-loading` (transcript loading observation with Events open).
  The diff-switch skeleton (file list stays mounted, diff region shows
  placeholders) derives from the `changes-text` specimen's loading part; its
  designer caption ("the row stays selected and no text is implied") is a
  drawing note and is not rendered. The full-pane Events skeleton shows only
  while history is loading; a summary still loading keeps records visible with
  the count line "Loading tool activity".
  Submitting from the starting composer does not move focus: Enter on an empty
  or blocked prompt keeps the caret; once pending, the controls are disabled.
- Task transcript + Events redraw (owner-approved 2026-11-08), mock-only:
  HarflowDesign `854caae4d474536f84e6e911ff96d48c4ada008b`,
  `v2/docs/decisions/README.md` (Centered and transcript redraws),
  `v2/scripts/screens-transcript.js`, `v2/scripts/transcript-screen.js`,
  `v2/scripts/d2b-proposal.js`. Pinned routes: `task/transcript-observed`,
  `transcript-loading`, `transcript-partial`, `transcript-unavailable`,
  `transcript-integrity-failed`, `transcript-reconnecting`,
  `transcript-capacity`, `transcript-sources` (each with `/events`). Request,
  history, and summary coverage are independent of execution status. Unknown
  totals never render as zero; withheld request text is omitted from the DOM;
  source change requires explicit “Load current activity”; capacity and
  reconnect keep cached rows/position. Events pane: task snapshot, captured
  activity totals, normalized Copy record, Recovered message, Record ordering;
  Changes and Artifacts disabled with explanations. Mapped running / failed /
  done sidebar fixtures use the same transcript surface; `/events` on a
  transcript route opens Events at load. Local earlier/fresh/rebase rows come
  from each observation’s prototypes (mock-owned). Reading windows merge across
  later observations; the eight pinned transcript states do not draw a Summary.
- States implemented:
  - `new-task/centered-empty` (and prior `new-task/default`) light/dark
  - `new-task/centered-loading`, `centered-unqualified`, `centered-invalid`,
    `centered-starting-plain`, `centered-refused`, `centered-options-closed`,
    `centered-harness-open` light/dark (mock scenarios)
  - `task/changes-loading`, `task/events-loading` light/dark (mock scenarios)
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
  - `task/running/light` and `/dark` (slim header, transcript surface rows,
    expandable tool disclosures, follow-up composer shell — send/stop
    unavailable; no right pane for this mapped fixture)
  - `task/failed/light` and `/dark` (failed badge, transcript surface, failure
    banner; Retry / Copy resume command / follow-up send unavailable; no
    right pane or generated shell commands)
  - `task/done/light` and `/dark` transcript surface + summary + **read-only
    Changes pane** (done badge, Summary section, follow-up send unavailable;
    Changes open/close with fixture file rows and selected diff)
  - M05 task status screen (owner approval 2026-11-07, copy amendment
    2026-11-10): HarflowDesign `6e31cd7f4a7b63beb329c6a4b4d79ca5eef57863`,
    `v2/scripts/screens-m05-proposal.js`, `v2/scripts/m05-proposal.js`,
    `v2/styles/m05-proposal.css`, approval
    `v2/docs/decisions/m05-task-screen-approval.md` (including its 2026-11-10
    copy amendment). The column is the design's `columnHtml`: a collapsed
    Original request disclosure, resource card, notice, `transcript(...)` rows
    and banner inside one scroller, with no speaker labels, history header or
    live strip. The older transcript surface (Design `854caae`) keeps only the
    D2B `task/transcript-*` scenarios and tasks without a conversation. Preview
    routes map to `task/*` states below (light/dark through session
    appearance); the renderer ids differ from the route ids (`state-running` →
    `running-stop`, `state-stopping` → `stop-requested`, `state-failed` →
    `failed-continue`, and `state-<name>` → `<name>` otherwise).
    Legacy preview ids `task-running`, `task-failed`, and the existing
    `task-loading` skeleton stay for migration; aliased M05 ids
    `task-running-stop` and `task-failed-continue` reuse the same `openTaskId`
    seeds. Commands are `aria-disabled` with shared unavailable explanations
    (`taskUnavailable.ts`); only controls the design draws disabled (unknown
    failed Continue, Stopping…, Starting…) are dimmed.
    - `task/running-stop` → `task-running-stop` (also `task-running`)
    - `task/stop-requested` → `task-stop-requested`
    - `task/cancelled` → `task-cancelled`
    - `task/timed-out` → `task-timed-out` (the failed task, no failure banner)
    - `task/settling` → `task-settling`
    - `task/unknown-failed` → `task-unknown-failed`
    - `task/unknown-done` → `task-unknown-done`
    - `task/owner-lost` → `task-owner-lost`
    - `task/unverified` → `task-unverified`
    - `task/launch-unknown` → `task-launch-unknown` (seeded `continue-unknown`
      command chrome)
    - `task/status-unavailable` → `task-status-unavailable`
    - `task/pending` → `task-pending` (with the Waiting for resources card)
    - `task/taken-over` → `task-taken-over`
    - `task/continue-starting` → `task-continue-starting`
    - `task/continue-started` → `task-continue-started` (two turns)
    - `task/failed-continue` → `task-failed-continue` (also `task-failed`)
  - `task/transcript-observed`, `transcript-loading`, `transcript-partial`,
    `transcript-unavailable`, `transcript-integrity-failed`,
    `transcript-reconnecting`, `transcript-capacity`, `transcript-sources`
    light/dark (mock scenarios; Events closed and `/events` open for each)
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
| Parallel group (legacy lanes) | Design `parallel-group/lanes` at HarflowDesign `17739e4` (`v2/scripts/screens-parallel-group.js`) | **Mock-only presentation** — Running sidebar row “Review preload bridge” opens `observeParallelGroup` for `parallel-group-preload-bridge`; harness titles, findings end rows, shared 320pt wide floor, View prompt unavailable (no stored prompts); leave/reopen cancels the observation |
| Parallel group lane decisions | Design `2153ab1d963709d8fbe77cd0bfd678292202a863` (`v2/scripts/states-parallel-lanes.js`, `v2/styles/parallel-lanes.css`); approval `4ff7d83`; `lane-history-boundary` follows `4ff7d83` (no “Available captured history”) | **Mock-only** — titled lanes (`lanes-titled` and family), Open task menu, View prompt reveal, Cancel-all dialog at app level over the inert sidebar and main (confirm unavailable), settled/failed/cancelled/taken-over/activity/history/empty/two-lanes/`loading-two` (member count null), plus 1000×620 twins; badge tone, Cancel all, and View prompt derived in presentation, not domain fields; Send / Cancel-all confirm / Load current activity stay unavailable (no mutation); workflow-run Parallel lanes (D21) unchanged — follow-up |
| Parallel group queued messages | Design `2153ab1` states `lane-messages-queued`, `lane-message-delivering`, `lane-message-uncertain`, `lane-message-cancelled` (`states-parallel-lanes.js` `queue` / `runningWith`; styles from `messages-screen.css` under `.hd-msgq-host` and `m05-proposal.css` `hd-m05-caption`); owner approval 2026-11-12 | **Mock-only** — observed queue on the running lane (id, text, delivery, taskId fence); presentation derives caption / Cancel / delivery outcome; cancelled outcome is seeded session chrome, scoped to the running lane (a typed kind mapped to its copy in presentation, shown only in the lane it names); Cancel stays unavailable (no mutation); no 1000×620 drawings |
| Pending launches | Design `83d820f57e6ec2d82cccd3a1e335128332fdb672` (`v2/scripts/screens-pending-launches.js`, `v2/styles/pending-launches.css`); approval recorded in `2934681`; decision `v2/docs/decisions/pending-launch-discovery.md` | **Mock-only** — capability observation `task-pending-launch.v1` gates the clock-icon nav item; inventory + locked detail for all 21 `task/pending-*` states (including 1000×620 waiting / stop-confirm / stop-requested minima). The domain carries observed phase, stop support, and structured facts (created timestamp, resource names); headings, leads, inventory status labels, and fact strings are derived in presentation from the decision’s API table. Unknown, missing, recorded, and handoff-failed launches show the neutral title and only the full Selected ID; a waiting launch without named resources or a not-started launch without a stored reason maps to the unavailable view rather than invented copy. The preparing handshake has no Stop control (heading and lead explain why). A prior Stop outcome (requested / uncertain / refused) is the result of the cancel command, held as session presentation state and seeded by the Stop scenarios — not part of the status observation. A status payload whose launch ID differs from the requested ID is rejected as unavailable. Stop sheet at app level (sidebar and main inert); Request Stop / Check again / Check next page / Check task status stay unavailable (no mutation); no fabricated recorded handoff; single-ID status loading is undesigned (see review notes); provisional queued-message and approval states out of scope |
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
| Needs you loading | Design `needs-you/loading` at HarflowDesign `9d19fd7` (`v2/scripts/screens-loading-more.js`, skeleton spec `needs-you`) | **Mock-only main-pane** — title real; waiting badge and three request cards are shimmer placeholders (measured 1280×800 geometry from that pin); sidebar Running/Recent stay independently known; full Design `SB` sidebar-data skeleton remains a separate prerequisite. The 1000 × 620 companion is `needs-you/loading-minimum` below |
| Minimum window (1000 × 620) | Design approval `246cc97ca47643422af67ff7b00acc494d3e1d42`; drawings `v2/scripts/screens-minimum.js` @ `246cc97…`, frame helpers `v2/scripts/minimum-frame.js` and `v2/styles/minimum-frame.css` @ `cd606f0e83b97fd79c807e3376b3fdbfae93ef2d`; inventory/decision rows last touched at `2934681218ff98d13fcffc012ebaa19640f64c23` | **Mock-only layout** — responsive narrow rules (lanes 360, inspector 288, meta drops to a focusable named dot, canvas scrolls). Preview uses the existing `seed.frame: 'minimum'` → `hw-preview__app--minimum` chrome; the narrow rules are the same container query the real window uses (no preview-only lane or inspector rules). Narrow Instructions stacks label over textarea per `workflow-editor/node-selected-minimum`; meta role is `note` with the text exposed once (`v2/scripts/minimum-frame.js` `topbarMeta`) Menu-bar and task-screen minima are out of scope |
| Needs you waiting-minimum | Design `needs-you/waiting-minimum` (of `needs-you/waiting`) | Sidebar body scrolls; representative drawing of the shared sidebar rule |
| Parallel group lanes-minimum | Design `parallel-group/lanes-minimum` (of `parallel-group/lanes`) | 360pt lanes; top-bar meta drops to a focusable dot |
| Workflow run parallel-minimum | Design `workflow-run/parallel-minimum` (of `workflow-run/parallel`) | Same lane and meta rules on the Nightly Parallel view |
| Workflow editor node-selected-minimum | Design `workflow-editor/node-selected-minimum` (of `workflow-editor/node-selected`) | Inspector 288; canvas scrolls; meta drops |
| Workflow editor orchestrator-minimum | Design `workflow-editor/orchestrator-minimum` (of `workflow-editor/orchestrator`) | Same editor narrow rules with the locked orchestrator selected |
| Needs you loading-minimum | Design `needs-you/loading-minimum` | Waiting skeleton in the 1000 × 620 frame; deferred `observeNeedsYou` |
| Parallel group loading-minimum | Design `parallel-group/loading-minimum` | Lane skeleton; meta shimmer omitted so loading has no focusable meta |
| Workflow run loading-parallel-minimum | Design `workflow-run/loading-parallel-minimum` | Parallel skeleton at 1000 × 620; no focusable meta |
| Workflow editor loading-minimum | Design `workflow-editor/loading-minimum` | Editor skeleton; inspector 288; no focusable meta |
| New task loading | Design `new-task/loading` @ `9d19fd7` (`screens-loading-work.js`, spec `new-task`) | **Mock-only** — deferred context; greeting and composer frame real; options/repo placeholders |
| Sidebar loading | Design `sidebar/loading` @ `9d19fd7` (`screens-loading-work.js`, spec `sidebar`) | **Mock-only** — Running/Recent and Needs you count placeholders; nav headings real; main area stays centered empty composer |
| Task loading | Design `task/loading` @ `9d19fd7` (`screens-loading-work.js`, spec `task`) | **Mock-only** — mirrors `task/running-stop`; known title when the sidebar supplies it; transcript/status placeholders |
| Parallel group loading | Design `parallel-group/loading` @ `9d19fd7` (`screens-loading-work.js`, spec for lanes) | **Mock-only** — deferred `observeParallelGroup`; lane frames real, header/transcript placeholders |
| Workflows loading | Design `workflows/loading` @ `9d19fd7` (`screens-loading-more.js`, spec `workflows`) | **Mock-only** — title/search/New workflow real; list rows placeholders |
| Workflow editor loading | Design `workflow-editor/loading` @ `9d19fd7` (`screens-loading-more.js`, spec `workflow-editor`) | **Mock-only** — toolbar/tray/zoom real; title, nodes, canvas, inspector placeholders |
| Workflow run loading | Design `workflow-run/loading` and `loading-parallel` @ `9d19fd7` (`screens-loading-more.js`) | **Mock-only** — deferred execution; Graph or Parallel preference while loading; mirrors on-demand / parallel |
| Resources loading | Design `resources/loading` @ `9d19fd7` (`screens-loading-more.js`, spec `resources`) | **Mock-only** — title/headings real; harness cards and waiting list placeholders |
| Statistics loading | Design `statistics/loading` @ `9d19fd7` (`screens-loading-more.js`, spec `statistics`) | **Mock-only** — title, range control, labels, column headers real; figures/chart/table cells placeholders |
| Settings loading | Design `settings/loading-general`, `loading-harnesses`, `loading-mcp-approvals` @ `9d19fd7` (`screens-loading-more.js`) | **Mock-only** — General uses a deferred `observeSettingsGeneral` observation; Harnesses/MCP use deferred `observeHarnesses`, and MCP approvals shows its placeholder under the session-expanded harness only (deviation from the all-rows drawing) |
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
  Main-pane loading follows approved Design `9d19fd7` `needs-you/loading`
  (skeleton of waiting). Unavailable and partial coverage remain proposals
  without approved specimens. Partial coverage shows the known items plus an
  incomplete mark. Needs you loading does not blank known sidebar work rows
  or invent a waiting count; full app `SB` fidelity is a separate prerequisite.
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
