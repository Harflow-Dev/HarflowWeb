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
| Populated | Design-aligned new-task + workflows + resources + statistics + mapped running-task fixtures |
| Empty sidebar | Ready composer; empty Running/Recent |
| Context loading | Proposal status (not design-approved) |
| Context unavailable | Proposal status (not design-approved) |
| Partial sidebar | Incomplete coverage note (proposal) |
| Submit accepted | Outcome ≈ `ctl-launch-run-accepted` |
| Submit refused | Outcome ≈ `ctl-launch-run-refused`; draft kept |
| Submit unknown | Outcome ≈ `ctl-launch-run-unknown`; draft kept; no auto-retry |
| Stale response | Holds start; remount/dispose, then “Resolve held start” — late accept ignored |
| Workflows list | Approved `workflows/list` definition rows |
| Workflows empty | Approved `workflows/empty` specimen |
| Resources slots | Approved `resources/slots` harness cards + waiting list |
| Statistics overview | Approved `statistics/overview` ranges (7d + 30d populated; All time incomplete) |
| Task running | Approved `task/running` transcript for mapped sidebar rows |
| Task failed | Approved `task/failed` transcript for the mapped recent-work row |
| Task done | Approved `task/done` transcript+summary + read-only Changes pane |
| Needs you empty | Approved `needs-you/empty` specimen. Populated scenarios use `needs-you/waiting` |

Sidebar navigation between **New task**, **Workflows**, **Resources**,
**Statistics**, **Settings**, and **Needs you** is live, and explicitly mapped Running / Recent rows open the
matching task transcript. Draft text, selections, pending launch outcomes, the
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
the list. The MCP approvals control only expands the selected harness.
Needs you observes `observeNeedsYou(…)`. The sidebar count is that
observation: three waiting items on the populated fixture, no count on the
empty scenario, and no zero when the observation is loading or unavailable.
Approve, reject, and Send stay disabled. The Nightly card’s Open run opens
`observeWorkflowExecution(runId, …)` for `run-nightly-dependency-audit`.
That id is not the workflow definition id. An unmapped run id shows
unavailable and does not borrow the Nightly graph. Mapped Open task only
navigates. A workflow-list Run button opens that definition’s run form through
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
