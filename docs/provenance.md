# Design and contract provenance

## Design (approved specimens)

- Repository: https://github.com/Harflow-Dev/HarflowDesign
- Immutable commit: `3643d083700be4032c93237813b573d04bab6ab1`
- Paths:
  - `v2/docs/approval.md`
  - `v2/docs/screen-inventory.md`
  - `v2/scripts/screens-new-task.js`
  - `v2/scripts/screens-workflows.js`
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
- Visual inspection also used hosted `https://design.harflow.dev/v2` (cheaper than a
  local archive server). Hosted content may be newer than the pinned commit;
  implementation citations remain the immutable commit above.
- `v2/docs/migration-coverage.md` is **absent** at the pinned commit (added in
  later commits such as `268b917`). Coverage ledger was not available for that
  pin; approval + screen-inventory were used instead.

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
| Repository options | Mock-only | Future server-hosted repos; not filesystem pickers; not ctl |

The mock adapter is not an HTTP protocol design and does not prove backend
compatibility.
