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

Sidebar navigation between **New task**, **Workflows**, **Resources**, and
**Statistics** is live, and explicitly mapped Running / Recent rows open the
matching task transcript. Draft text, selections, pending launch outcomes, the
selected statistics range, theme, and sidebar collapse are preserved across
pages; navigation never starts or repeats a task. Changing the statistics range
requests that range through `observeStatistics(range, …)` and cancels the prior
observation — it does not relabel unchanged totals. Opening another mapped task
requests `observeTask(taskId, …)` and cancels the prior task observation.

Run, Edit, New workflow, “Describe one to an agent”, Resources task links,
Install, unmapped sidebar rows, follow-up send, Stop (running only), Retry, and
Copy resume command remain visible where the design shows them and report
unavailable in this slice — no mutation, no admin, no engine calls, and no
generated shell commands. Tool-row expand/collapse is local UI only.

Valid zero task counts and observed zero cost remain distinct from unavailable
observation data. Unknown or unavailable facts are not coerced to zero.

Tests use controllable promises (`src/adapters/mock/controllable.ts`) rather than
sleeps or randomness.
