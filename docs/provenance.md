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
    right pane, task tabs, or approvals)
  - `task/failed/light` and `/dark` (failed badge, diagnostic transcript, failure
    banner; Retry / Copy resume command / follow-up send unavailable; no
    right pane or generated shell commands)
  - `task/done/light` and `/dark` transcript + summary + **read-only Changes
    pane** (done badge, diagnostic transcript, Summary section, follow-up send
    unavailable; Changes open/close with fixture file rows and selected diff).
    Artifacts and Events tabs remain explicitly unavailable. The specimen’s
    Artifacts/Events destinations and any edit/download/apply actions are not
    implemented.
  - `settings/general/light` and `/dark` (General page composition). Appearance
    uses the shared session System/Light/Dark state and is not persisted.
    Behaviour switches, runtime update checks, and task-store actions stay
    unavailable or read-only specimen facts.
  - `settings/harnesses/light` and `/dark` (registration, install badges, and
    qualification). Installation, MCP registration, and qualification are
    independent fixture facts. Refresh, update, remove, and MCP approvals stay
    disabled. The approvals editor is omitted. Paths and readiness sentences
    are specimen copy, not this computer.
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
| Failed-task transcript | Design `task/failed` specimen copy | **Mock-only presentation** — explicit failed status; no running chrome; Retry/Copy resume unavailable |
| Completed-task transcript | Design `task/done` transcript+summary copy | **Mock-only presentation** — fixture evidence only; tool success ≠ verified authorship |
| Completed-task Changes | Design `task/done` Changes pane file list + selected diff | **Mock-only presentation** — recorded repository observations; not Git/fs; not authorship proof; independent of task success |
| Settings general | Design `settings/general` specimen copy | **Mock-only presentation** — shared session appearance only; behaviour/runtime/store unavailable or static facts; not persisted |
| Settings harnesses | Design `settings/harnesses` registration, install, and qualification copy | **Mock-only presentation** — independent fixture facts; unknown stays unknown; no PATH probe, install, registration change, or MCP approval management |
| Needs you waiting | Design `needs-you/waiting` approvals and one question | **Mock-only presentation** — fixture requests, not this computer; exact-action labels; no approval authority |
| Needs you empty | Design `needs-you/empty` | **Mock-only presentation** — complete coverage and zero items only; unknown is not this state |
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
  Loading, unavailable, and partial coverage are proposals without approved
  specimens. Partial coverage shows the known items plus an incomplete mark.
- Mapped Open task navigates to that task. Open run and unmapped Open task
  stay unavailable. The reply control is not a submitting form.

The mock adapter is not an HTTP protocol design and does not prove backend
compatibility.
