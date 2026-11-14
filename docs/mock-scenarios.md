# Mock scenario instructions

Open the development preview:

```bash
npm run dev
# visit http://localhost:5173/preview
```

Scenario controls live only on `/preview`. The main route (`/`) uses the
populated fixture and shows a single “Mock engine” badge.

| Scenario | What it shows |
| --- | --- |
| Populated | Design-aligned new-task (centered grow-to-cap composer and + task options) ≈ `new-task/centered-empty` + workflows + resources + statistics + mapped running-task fixtures |
| Empty sidebar | Ready composer; empty Running/Recent |
| Context loading | Legacy id for `new-task/loading`. Prefer **New task loading** |
| New task loading | Approved `new-task/loading` skeleton (Design `9d19fd7`). Deferred context and Needs you; greeting and composer frame stay real |
| Sidebar loading | Approved `sidebar/loading` (Design `9d19fd7`). Composer operable; Running/Recent and Needs you count placeholders |
| Task loading | Approved `task/loading` (Design `9d19fd7`) mirroring `task/running-stop`. Deferred task; opens mapped Slot release row |
| Workflows loading | Approved `workflows/loading` skeleton (Design `9d19fd7`). Deferred workflows list; opens Workflows |
| Workflow editor loading | Approved `workflow-editor/loading` (Design `9d19fd7`). Deferred editor for Release checklist |
| Workflow run loading | Approved `workflow-run/loading` (Design `9d19fd7`) mirroring on-demand. Deferred Nightly execution |
| Workflow run loading · Parallel | Approved `workflow-run/loading-parallel` (Design `9d19fd7`). Same deferred run with Parallel preference |
| Parallel group loading | Approved `parallel-group/loading` (Design `9d19fd7`). Deferred Review preload bridge group |
| Parallel group loading · two | Approved `parallel-group/loading-two` (Design `2153ab1`). Deferred group with unknown member count (`memberCount: null`); two skeleton frames |
| Parallel group · lanes titled | Approved `parallel-group/lanes-titled` (Design `2153ab1`). Task titles; Harness · model captions |
| Parallel group · lane menu open | Approved `parallel-group/lane-menu-open`. Open task only |
| Parallel group · prompt shown | Approved `parallel-group/prompt-shown`. View prompt pressed |
| Parallel group · Cancel all confirm | Approved `parallel-group/cancel-all-confirm`. Dialog open; confirm unavailable |
| Parallel group · settled | Approved `parallel-group/lanes-settled`. Badge “3 done”; no Cancel all |
| Parallel group · lane failed | Approved `parallel-group/lane-failed` |
| Parallel group · lane cancelled | Approved `parallel-group/lane-cancelled` |
| Parallel group · lane taken over | Approved `parallel-group/lane-taken-over` |
| Parallel group · activity unavailable | Approved `parallel-group/lane-activity-unavailable` |
| Parallel group · history boundary | Approved `parallel-group/lane-history-boundary` (Design `4ff7d83`) |
| Parallel group · Messages queued | Approved `parallel-group/lane-messages-queued` (Design `2153ab1`) |
| Parallel group · Message delivering | Approved `parallel-group/lane-message-delivering` (Design `2153ab1`) |
| Parallel group · Message uncertain | Approved `parallel-group/lane-message-uncertain` (Design `2153ab1`) |
| Parallel group · Message cancelled | Approved `parallel-group/lane-message-cancelled` (Design `2153ab1`); outcome seeded |
| Parallel group · empty | Approved `parallel-group/group-empty` |
| Parallel group · two lanes | Approved `parallel-group/two-lanes` |
| Parallel group · lanes titled · minimum | Approved `lanes-titled-minimum` at 1000×620 |
| Parallel group · lane menu · minimum | Approved `lane-menu-open-minimum` |
| Parallel group · prompt · minimum | Approved `prompt-shown-minimum` |
| Parallel group · Cancel confirm · minimum | Approved `cancel-all-confirm-minimum` |
| Parallel group · settled · minimum | Approved `lanes-settled-minimum` |
| Parallel group · cancelled · minimum | Approved `lane-cancelled-minimum` |
| Parallel group · failed · minimum | Approved `lane-failed-minimum` |
| Parallel group · empty · minimum | Approved `group-empty-minimum` |
| Pending launches · Inventory | Approved `task/pending-inventory` (Design `83d820f`). Capability on; opens inventory |
| Pending launches · Loading | Approved `task/pending-loading`. Deferred inventory; disabled Check again under the skeleton. Sidebar history is not skeletonized (see review notes) |
| Pending launches · Empty | Approved `task/pending-empty` |
| Pending launches · Failed | Approved `task/pending-failed` |
| Pending launches · Incomplete | Approved `task/pending-incomplete`. Entries kept + coverage warning |
| Pending launches · Waiting | Approved `task/pending-waiting` |
| Pending launches · Preparing | Approved `task/pending-preparing` |
| Pending launches · Preparing handshake | Approved `task/pending-preparing-handshake`. No Stop control; heading and lead explain |
| Pending launches · Granted | Approved `task/pending-granted` |
| Pending launches · Not started | Approved `task/pending-not-started` |
| Pending launches · Unavailable | Approved `task/pending-unavailable`. Neutral title; only Selected ID |
| Pending launches · Missing | Approved `task/pending-missing`. Neutral title; only Selected ID |
| Pending launches · Recorded | Approved `task/pending-recorded`. Neutral title; only Selected ID; Check task status unavailable |
| Pending launches · Handoff failed | Approved `task/pending-handoff-failed`. Neutral title; only Selected ID |
| Pending launches · Stop confirm | Approved `task/pending-stop-confirm`. Sheet open; Request Stop unavailable |
| Pending launches · Stop requested | Approved `task/pending-stop-requested`. Waiting status plus seeded `pendingLaunchStopOutcome: 'requested'` |
| Pending launches · Stop uncertain | Approved `task/pending-stop-uncertain`. Waiting status plus seeded `pendingLaunchStopOutcome: 'uncertain'` |
| Pending launches · Stop refused | Approved `task/pending-stop-refused`. Waiting status plus seeded `pendingLaunchStopOutcome: 'refused'` |
| Pending launches · Waiting · 1000×620 | Approved `task/pending-waiting-minimum` |
| Pending launches · Stop confirm · 1000×620 | Approved `task/pending-stop-confirm-minimum` |
| Pending launches · Stop requested · 1000×620 | Approved `task/pending-stop-requested-minimum`. Seeded stop outcome `requested` |
| Resources loading | Approved `resources/loading` (Design `9d19fd7`). Deferred resources; opens Resources |
| Statistics loading | Approved `statistics/loading` (Design `9d19fd7`). Deferred statistics; opens Statistics |
| Settings loading · General | Approved `settings/loading-general` (Design `9d19fd7`). Deferred settings-general observation; opens Settings · General |
| Settings loading · Harnesses | Approved `settings/loading-harnesses` (Design `9d19fd7`). Deferred harnesses; opens Settings · Harnesses |
| Settings loading · MCP approvals | Approved `settings/loading-mcp-approvals` (Design `9d19fd7`). Deferred harnesses with Claude Code's MCP approvals seeded expanded (`settingsExpandedHarnessId`) |
| Context unavailable | Proposal status (not design-approved) |
| Partial sidebar | Incomplete coverage note (proposal) |
| Submit accepted | Outcome ≈ `ctl-launch-run-accepted` |
| Submit refused | Outcome ≈ `ctl-launch-run-refused`; draft kept |
| Submit unknown | Outcome ≈ `ctl-launch-run-unknown`; draft kept; Start and selections locked; no second launch; no Review Recent work navigation |
| Stale response | Holds start; remount/dispose, then “Resolve held start” — late accept ignored |
| Composer loading | Design `new-task/centered-loading` — observation `qualification: checking` |
| Composer unqualified | Design `new-task/centered-unqualified` — `qualification: unqualified` |
| Composer invalid | Design `new-task/centered-invalid` — turns `0`, Task options open |
| Composer starting | Design `new-task/centered-starting-plain` (76ad937) — no visible status row; Start named Starting task; StatusRegion announces Starting task…; Resolve held start |
| Task Changes loading | Design `task/changes-loading` (M05) — deferred Changes on the completed fixture; pane open |
| Task Events loading | Design `task/events-loading` (M05) — transcript loading observation; Events pane open |
| Composer refused | Design `new-task/centered-refused` — refuse code+reason; draft kept |
| Composer options closed | Design `new-task/centered-options-closed` — effort high, options collapsed |
| Composer harness open | Design `new-task/centered-harness-open` — Unavailable harness selected+disabled; hint in menu |
| Sidebar collapsed | Design `sidebar/centered-collapsed` |
| Sidebar minimum | Design `sidebar/centered-minimum` — preview frame 1000×620 |
| Needs you · minimum | Design `needs-you/waiting-minimum` — 1000×620 frame; opens Needs you |
| Parallel group · minimum | Design `parallel-group/lanes-minimum` — Review preload bridge; meta drops to a focusable dot |
| Workflow run Parallel · minimum | Design `workflow-run/parallel-minimum` — Nightly Parallel at 1000×620 |
| Workflow editor · minimum | Design `workflow-editor/node-selected-minimum` — Release checklist; inspector 288 |
| Workflow editor orchestrator · minimum | Design `workflow-editor/orchestrator-minimum` — orchestrator selected after ready |
| Needs you loading · minimum | Design `needs-you/loading-minimum` — deferred Needs you at 1000×620 |
| Parallel group loading · minimum | Design `parallel-group/loading-minimum` — deferred group; no focusable meta |
| Workflow run loading Parallel · minimum | Design `workflow-run/loading-parallel-minimum` — deferred Parallel at 1000×620 |
| Workflow editor loading · minimum | Design `workflow-editor/loading-minimum` — deferred editor at 1000×620 |
| Workflows list | Approved `workflows/list` definition rows |
| Workflows empty | Approved `workflows/empty` specimen |
| Resources slots | Approved `resources/slots` harness cards + waiting list |
| Statistics overview | Approved `statistics/overview` ranges (7d + 30d populated; All time incomplete) |
| Task running | Approved `task/running` transcript for mapped sidebar rows |
| Task failed | Approved `task/failed` transcript for the mapped recent-work row |
| Task done | Approved `task/done` transcript+summary + read-only Changes pane |
| Transcript observed | Design `task/transcript-observed` (Design 854caae) |
| Transcript loading | Design `task/transcript-loading` |
| Transcript partial | Design `task/transcript-partial` |
| Transcript unavailable | Design `task/transcript-unavailable` |
| Transcript integrity failed | Design `task/transcript-integrity-failed` |
| Transcript reconnecting | Design `task/transcript-reconnecting` |
| Transcript capacity | Design `task/transcript-capacity` |
| Transcript sources | Design `task/transcript-sources` — tool disclosure in the transcript; unsupported stub only in Events |
| Transcript · Events | Any of the eight with `/events` (hash `#task/transcript-*/events` or scenario id `transcript-*/events`) opens Events at load. Pinned transcript completed states omit Summary; `task/done` keeps its fixture summary. |
| Needs you empty | Approved `needs-you/empty` specimen. Populated scenarios use `needs-you/waiting` |
| Needs you loading | Approved `needs-you/loading` main-pane skeleton (Design `9d19fd7`). Deferred Needs you read; populated context keeps live Running/Recent. Open Needs you in the preview after selecting the scenario. Full sidebar `SB` remains out of scope; use **Needs you loading · minimum** for the 1000×620 companion |

First-load skeleton scenarios live in `src/adapters/mock/scenarioCatalogLoading.ts`.
Minimum-window scenarios (loaded and loading) live in
`src/adapters/mock/scenarioCatalogMinimum.ts` and reuse `seed.frame: 'minimum'`
(same `hw-preview__app--minimum` chrome as Sidebar minimum). They keep the
mirrored chrome real and shimmer only the measured data regions.
Resolve a deferred observation from the preview controls (or remount) to replace
the skeleton with the loaded screen without a layout jump.

Sidebar navigation between **New task**, **Workflows**, **Resources**,
**Statistics**, **Settings**, and **Needs you** is live. Explicitly mapped
Running / Recent task rows open the matching task transcript. The Running row
**Review preload bridge** (parallel glyph, meta `1/3`) opens the Parallel
group screen through `observeParallelGroup(groupId, …)` — legacy
`parallel-group/lanes` (HarflowDesign `17739e4`) on the sidebar mapping.
Titled-lane preview scenarios use Design `2153ab1` fixtures. An unmapped
group id stays unavailable; a ready empty group shows the approved empty
message. Leaving cancels the observation. View prompt, lane menu (Open task),
and Cancel-all dialog open/close work; Send, Cancel-all confirm, and Load
current activity stay unavailable. On New task the composer matches the M04 centered
amendment and the 854caae redraw: one-line prompt that grows to six lines,
visual status line (live announcements stay in `StatusRegion`), and a `+` Task
options control for effort, turn limit, and approvals. Escape returns focus to
`+` for options only — it does not close repository/harness/access pickers.
Outside click closes options without that focus move. Qualification
(`checking` / `unqualified`) and invalid options outrank a prior accepted or
refused message. Refused copy is `Start was refused (${code}): ${reason}`.
Those options gate Start in the mock and are not added to the start request.
The expanded sidebar scrolls nav + Running + Recent as one body. Draft text, selections, pending launch outcomes, the
selected statistics range, theme, and sidebar collapse are preserved across
pages; navigation never starts or repeats a task. Changing the statistics range
requests that range through `observeStatistics(range, …)` and cancels the prior
observation — it does not relabel unchanged totals. Opening another mapped task
requests `observeTask(taskId, …)` and cancels the prior task observation.
Opening the Changes pane on the completed fixture observes
`observeTaskChanges({ taskId, selectedPath }, …)`; selecting a file re-keys that
observation and clears the prior diff immediately. Settings → Harnesses observes
`observeHarnesses(…)`. Install, MCP registration, and qualification are separate
fixture fields. Approval entries belong to that harness id. A later loading
or unavailable result drops the previous ready rows. Refresh, update, remove,
Add approval, and Remove approval stay disabled and do not re-observe or edit
the list. The MCP approvals control only expands the selected harness. The
expanded harness is session state, so it persists across navigation and
through loading; a ready observation that does not list it collapses it.
Needs you observes `observeNeedsYou(…)`. The sidebar count is that
observation: three waiting items on the populated fixture, no count on the
empty scenario, and no zero when the observation is loading or unavailable.
Approve, reject, and Send stay disabled. The Nightly card’s Open run opens
`observeWorkflowExecution(runId, …)` for `run-nightly-dependency-audit`.
That id is not the workflow definition id. An unmapped run id shows
unavailable and does not borrow the Nightly graph. Leaving that run, including by a mapped sidebar task, cancels its
observation, so a late callback cannot restore it. The next Workflows
click returns to an editor or launch form that was already open, and shows
the list only when neither is open. The Nightly publish card and the run detail share one
snapshot: branch `deps/audit-2026-11-03`, Codex · gpt-6-astra, repository
HarflowMCP, and the same push-and-open-a-pull-request action. The graph
specimen’s `audit/2026-11-03`, Codex · gpt-6, and “on HarflowMCP” are adapted
to that request. Graph node roles stay the graph specimen. Security reviewer
opens a read-only call inspector for that node. The choice is presentation
state: a later observation for the same run keeps it, and closing or opening
the run returns to Open pull request. An unknown or mismatched node id shows
that default detail and does not use another node's calls. The strip keeps
“2 calls · one at a time”; the on-demand specimen's “2 calls” is recorded in
`docs/provenance.md`. Docs checker, call rows, Open task, the node
composer, and the canvas zoom control stay unavailable. The zoom label reads 70%,
and its buttons use their own explanation rather than the Pause and Cancel text.
The Graph / Parallel control toggles the Nightly run’s Parallel lanes and
orchestrator footer from the same observation; missing or empty lanes fall back
to Graph and disable Parallel with a Parallel-specific explanation. recovery
stays unavailable. Lane composers and lane actions stay disabled. Mapped Open
task only navigates. A workflow-list Run button opens that definition’s run form through
`observeWorkflowRun(workflowId, …)`. The draft is session-local and kept per
definition id. Switching definitions clears the previous permissions into
loading and does not reuse the other draft. An unmapped id shows unavailable
and no form. The form’s Run control stays disabled. Goal collapse keeps the
goal text. Custom orchestrator stays unavailable. Permission lines are fixture
facts with an explicit non-enforcement caption. A workflow-list Edit
button opens that definition’s read-only editor through
`observeWorkflowEditor(workflowId, …)`. Release checklist and Nightly
dependency audit have graphs. Another id shows unavailable and no borrowed
graph. Selection is kept per definition while the node is still present.
A removed node stays missing. Save, Discard, Delete, Run, Edit with agent,
zoom, and inspector fields stay disabled. The locked orchestrator opens
Agent, Instructions, and Limits from its own fixture and stays off the
graph. Opening the editor does not clear
run drafts.

New workflow, “Describe one to an agent”, Resources task links,
Install, unmapped sidebar rows, follow-up send, Stop (running only), Retry,
Copy resume command, Artifacts, Events, Check for updates, Inspect task store,
and Show backup in Finder remain visible where the design shows them and report
unavailable in this slice — no mutation, no admin, no engine calls, and no
generated shell commands. Settings behaviour switches and harness mutation
controls stay disabled specimen controls with an accessible explanation.
MCP approvals only expands the selected harness’s fixture list. Settings
appearance is the shared session theme only. General and Harnesses share that
theme. Tool-row expand/collapse, MCP approvals, and Changes file selection
are local UI only (selection re-observes fixture content).

Valid zero task counts and observed zero cost remain distinct from unavailable
observation data. Unknown or unavailable facts are not coerced to zero.

Tests use controllable promises (`src/adapters/mock/controllable.ts`) rather than
sleeps or randomness.
