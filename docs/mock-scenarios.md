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
fixture fields. A later loading or unavailable result drops the previous ready
rows. Refresh, update, remove, and MCP approvals are disabled and do not
re-observe. Needs you observes `observeNeedsYou(…)`. The sidebar count is that
observation: three waiting items on the populated fixture, no count on the
empty scenario, and no zero when the observation is loading or unavailable.
Approve, reject, Send, and Open run stay disabled. Mapped Open task only
navigates. A workflow-list Run button opens that definition’s run form through
`observeWorkflowRun(workflowId, …)`. The draft is session-local and kept per
definition id. Switching definitions clears the previous permissions into
loading and does not reuse the other draft. An unmapped id shows unavailable
and no form. The form’s Run control stays disabled. Goal collapse keeps the
goal text. Custom orchestrator stays unavailable. Permission lines are fixture
facts with an explicit non-enforcement caption.

Edit, New workflow, “Describe one to an agent”, Resources task links,
Install, unmapped sidebar rows, follow-up send, Stop (running only), Retry,
Copy resume command, Artifacts, Events, Check for updates, Inspect task store,
and Show backup in Finder remain visible where the design shows them and report
unavailable in this slice — no mutation, no admin, no engine calls, and no
generated shell commands. Settings behaviour switches and harness actions stay
disabled specimen controls with an accessible explanation. Settings appearance
is the shared session theme only. General and Harnesses share that theme. Tool-row expand/collapse and Changes
file selection are local UI only (selection re-observes fixture content).

Valid zero task counts and observed zero cost remain distinct from unavailable
observation data. Unknown or unavailable facts are not coerced to zero.

Tests use controllable promises (`src/adapters/mock/controllable.ts`) rather than
sleeps or randomness.
