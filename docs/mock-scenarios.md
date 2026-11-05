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
| Populated | Design-aligned new-task + workflows list fixtures |
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

Sidebar navigation between **New task** and **Workflows** is live in the app and
preview. Run, Edit, New workflow, and “Describe one to an agent” remain visible
where the design shows them and report unavailable in this slice.

Tests use controllable promises (`src/adapters/mock/controllable.ts`) rather than
sleeps or randomness.
