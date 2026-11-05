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
  - `v2/scripts/screens-task.js`
  - `v2/scripts/components.js`
  - `v2/styles/tokens.css`
  - `v2/styles/bundle.css` (vendored into `src/styles/`)
- States implemented:
  - `new-task/default/light` and `/dark`
  - `new-task/harness-menu/light` and `/dark`
  - `new-task/sidebar-collapsed/light` and `/dark`
  - `workflows/list/light` and `/dark` (list chrome without product search; see
    coverage ledger deliberate removal of product search)
  - `workflows/empty/light` and `/dark`
  - `resources/slots/light` and `/dark` (populated, full-with-waiters, zero-holder,
    and not-installed cards; waiting list)
  - `statistics/overview/light` and `/dark` (range selector retained; 7-day and
    30-day populated fixtures; All time selects retained-history incomplete
    coverage rather than inventing all-time totals)
  - `task/running/light` and `/dark` (slim header, transcript, expandable tools,
    running indication, follow-up composer shell — send/stop unavailable; no
    right pane, task tabs, approvals, or completed/failed destinations)
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
| Resources slot observation | Design `resources/slots` specimen copy | **Mock-only presentation** — not a public ctl resources catalog; no install/release/admin |
| Statistics overview | Design `statistics/overview` specimen copy + distinct 7-day mock range | **Mock-only presentation** — not a public ctl statistics/billing API; success rate and median are fixture facts only when coverage is complete |
| Running-task transcript | Design `task/running` specimen copy | **Mock-only presentation** — not a public ctl transcript protocol; mapped fixture ids only |
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
- Follow-up send, stop, cancel, retry, approval, steering, and resume remain
  unavailable; expanding tools is local UI state only.
- Loading / unavailable treatments are proposals, not approved specimens, and
  must not show task A’s content under task B’s title.

The mock adapter is not an HTTP protocol design and does not prove backend
compatibility.
