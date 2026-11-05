# Visual validation — exploratory slices

Screenshots stored outside the repository.

## Workflows — incorrect prior captures (do not use for viewport claims)

Directory: `~/.codex/workflows/screenshots/2026-11-05-harflowweb-workflows-slice/`

These four files keep `1280x800` in the filename but are **not** 1280×800 viewports.
Programmatic check (`sips -g pixelWidth -g pixelHeight`):

| File | Actual PNG dimensions |
| --- | --- |
| `01-workflows-list-light-1280x800.png` | **1150×1360** |
| `02-workflows-list-dark-1280x800.png` | **1150×1360** |
| `03-workflows-empty-light-1280x800.png` | **1150×1360** |
| `04-workflows-empty-dark-1280x800.png` | **1150×1360** |

They were not renamed or resized to imply verification. Treat them as historical
mislabeled artifacts only.

## Workflows — verified 1280×800 captures

Directory:
`~/.codex/workflows/screenshots/2026-11-05-harflowweb-workflows-slice/verified-1280x800/`

Captured via CDP `Page.captureScreenshot` with clip `{x:0,y:0,width:1280,height:800}`
against a 1280×800 layout viewport. Dimensions verified with `sips`.

| File | Scenario | Viewport / PNG | Appearance |
| --- | --- | --- | --- |
| `01-workflows-list-light.png` | workflows/list | 1280×800 | light |
| `02-workflows-list-dark.png` | workflows/list | 1280×800 | dark |
| `03-workflows-empty-light.png` | workflows/empty (preview; panel hidden) | 1280×800 | light |
| `04-workflows-empty-dark.png` | workflows/empty (preview; panel hidden) | 1280×800 | dark |

Right-edge sample (rightmost column RGB uniform with near-edge background): no
right-edge content clipping observed on these verified PNGs.

## Resources — verified 1280×800 captures

Directory:
`~/.codex/workflows/screenshots/2026-11-05-harflowweb-resources-slice/`

Same CDP clip + `sips` verification. Preview scenario panel hidden for composition.

| File | Scenario | Viewport / PNG | Appearance / chrome |
| --- | --- | --- | --- |
| `01-resources-slots-dark-expanded.png` | resources/slots | 1280×800 | dark, sidebar expanded |
| `02-resources-slots-light-expanded.png` | resources/slots | 1280×800 | light, sidebar expanded |
| `03-resources-slots-light-collapsed.png` | resources/slots | 1280×800 | light, sidebar collapsed |
| `04-resources-slots-dark-collapsed.png` | resources/slots | 1280×800 | dark, sidebar collapsed |

Right-edge sample: uniform background column; `document`/`hd-app` scrollWidth
equals clientWidth (1280) — no horizontal overflow observed at this size.

## Statistics — verified 1280×800 captures

Directory:
`~/.codex/workflows/screenshots/2026-11-05-harflowweb-statistics-slice/`

Retaken from the main product route `/` (normal `AppFeature` composition; no
preview scenario panel). CDP clip `{x:0,y:0,width:1280,height:800}` after
`Emulation.setDeviceMetricsOverride` to 1280×800. Dimensions verified with
`sips`. Main-pane pixel diversity checked (not only right-edge uniformity):
each file has hundreds of distinct colors in the content region and shows
heading, range selector, headline tiles, chart bars, and harness table chrome.

| File | Scenario | Viewport / PNG | Appearance / chrome |
| --- | --- | --- | --- |
| `01-statistics-overview-light-expanded.png` | statistics/overview | 1280×800 | light, sidebar expanded |
| `02-statistics-overview-dark-expanded.png` | statistics/overview | 1280×800 | dark, sidebar expanded |
| `03-statistics-overview-dark-collapsed.png` | statistics/overview | 1280×800 | dark, sidebar collapsed |
| `04-statistics-overview-light-collapsed.png` | statistics/overview | 1280×800 | light, sidebar collapsed |

Default range in captures is the approved 30-day overview. Page content is
taller than 800px; the first viewport shows head/tiles/chart with the harness
table continuing in `.hd-scroll` (no document-level horizontal overflow).

### Prior blank Statistics captures (invalid evidence)

Earlier files with the same names under this directory were 1280×800 but showed
an almost empty main pane. Cause: capture setup on `/preview` used
`display:none` on `.hw-preview__panel` while `.hw-preview` kept
`grid-template-columns: 280px 1fr`, so the app occupied only the first 280px
track and the CDP full-viewport clip was mostly blank body background. That was
incorrect capture setup, not an application Statistics rendering failure. Those
artifacts were overwritten by the verified `/` captures above — do not treat
edge-uniform blank PNGs as visual proof.

## Running-task transcript — verified 1280×800 captures

Directory:
`~/.codex/workflows/screenshots/2026-11-05-harflowweb-task-running-slice/`

Captured from `/` (normal `AppFeature` composition) after opening the mapped
sidebar row “Fix flaky slot release test”. CDP clip
`{x:0,y:0,width:1280,height:800}` after `Emulation.setDeviceMetricsOverride`
to 1280×800. Dimensions verified with `sips`. Content-region color diversity
is hundreds of distinct colors per file (not blank).

| File | Scenario | Viewport / PNG | Appearance / chrome |
| --- | --- | --- | --- |
| `01-task-running-light-expanded.png` | task/running | 1280×800 | light, sidebar expanded |
| `02-task-running-dark-expanded.png` | task/running | 1280×800 | dark, sidebar expanded |
| `03-task-running-dark-collapsed.png` | task/running | 1280×800 | dark, sidebar collapsed |
| `04-task-running-light-collapsed.png` | task/running | 1280×800 | light, sidebar collapsed |

Observed in captures: slim topbar (title, running badge, meta), user message,
agent copy with inline code, expandable pytest tool body (FAILED lines), edit
row, “Running tests…” working row, follow-up composer with Stop unavailable and
send disabled. Document/`hd-app` scrollWidth equals clientWidth (1280). Transcript
scroll lives in `.hd-scroll` (column-reverse anchor per specimen; no JS auto-scroll).
Tool disclosure toggles `aria-expanded` under pointer/keyboard.

## Failed-task transcript — verified 1280×800 captures

Directory:
`~/.codex/workflows/screenshots/2026-11-05-harflowweb-task-failed-slice/`

Captured from `/` after opening the mapped Recent work row “Migrate events.jsonl
reader”. Same CDP clip + `sips` verification. Content-region color diversity is
hundreds of distinct colors per file.

| File | Scenario | Viewport / PNG | Appearance / chrome |
| --- | --- | --- | --- |
| `01-task-failed-light-expanded.png` | task/failed | 1280×800 | light, sidebar expanded |
| `02-task-failed-dark-expanded.png` | task/failed | 1280×800 | dark, sidebar expanded |
| `03-task-failed-dark-collapsed.png` | task/failed | 1280×800 | dark, sidebar collapsed |
| `04-task-failed-light-collapsed.png` | task/failed | 1280×800 | light, sidebar collapsed |

Observed: failed badge (`Failed 07:48`, no running spin), diagnostic transcript,
expanded pytest failure body, failure banner with Retry / Copy resume unavailable,
follow-up composer without Stop, send disabled. No working indicator. Document
scrollWidth equals clientWidth (1280).

## Completed-task transcript — verified 1280×800 captures

Directory:
`~/.codex/workflows/screenshots/2026-11-05-harflowweb-task-done-slice/`

Captured from `/` after opening the mapped Recent work row “Add retry budget to
delivery queue”. Same CDP clip + `sips` verification. Content-region color
diversity is hundreds of distinct colors per file.

| File | Scenario | Viewport / PNG | Appearance / chrome |
| --- | --- | --- | --- |
| `01-task-done-light-expanded.png` | task/done (transcript+summary) | 1280×800 | light, sidebar expanded |
| `02-task-done-dark-expanded.png` | task/done (transcript+summary) | 1280×800 | dark, sidebar expanded |
| `03-task-done-dark-collapsed.png` | task/done (transcript+summary) | 1280×800 | dark, sidebar collapsed |
| `04-task-done-light-collapsed.png` | task/done (transcript+summary) | 1280×800 | light, sidebar collapsed |

Observed: done badge (`Done 21:04`), diagnostic transcript, Summary separator and
body, follow-up composer without Stop (send disabled). No failure banner, Retry,
running badge, or working indicator. No Changes/Artifacts/Events right pane
(deliberately out of scope). Document scrollWidth equals clientWidth (1280).

Earlier new-task screenshots remain under
`~/.codex/workflows/screenshots/2026-11-05-harflowweb-new-task-slice/`.

## Design provenance for this inspection

- HarflowDesign commit `3643d083700be4032c93237813b573d04bab6ab1`
- Workflows: `v2/scripts/screens-workflows.js` (`workflows/list`, `workflows/empty`)
- Resources: `v2/scripts/screens-resources.js` (`resources/slots` light/dark)
- Statistics: `v2/scripts/screens-statistics.js` (`statistics/overview` light/dark)
- Task: `v2/scripts/screens-task.js` (`task/running`, `task/failed`, and
  `task/done` transcript+summary light/dark)
- Observed in the running Vite app (not substituted from hosted design)

## Checks performed

- Keyboard: New task / Workflows / Resources / Statistics are buttons; unmapped
  task destinations and Install announce unavailable in accessible names.
  Statistics period segment is a keyboard-operable button group (`aria-pressed`).
  Mapped running rows open the transcript; tool heads toggle with Enter/Space.
- Focus: theme, nav, tool disclosures, and range controls remain operable after
  route changes.
- Overflow: recent work scrolls in the sidebar; resources, statistics, and task
  pages fit 1280×800 without document-level horizontal overflow.
- Product search omitted per accepted coverage ledger; statistics range retained;
  task-level tabs / right pane omitted for this running-task slice.
- Empty workflows specimen copy verified (`No workflows yet` + create CTAs).
- Resources shows populated, full-with-waiters, zero-holder, and not-installed
  cards plus the waiting list from the approved specimen.
- Statistics chart exposes `role="img"` summary text plus an `.hd-sr` daily data
  table; harness table is visible.
- Running-task follow-up send stays disabled; Stop reports unavailable without
  mutation.
- Failed-task omits Stop and running chrome; Retry / Copy resume / follow-up
  send report unavailable without mutation or generated shell commands.
- Completed-task omits Stop, failure banner, and Retry; follow-up send stays
  disabled; right pane is not present (out of scope for this assignment).

## Limitations

- Pixel fidelity to native materials is not claimed.
- Workflows/resources/statistics/task loading and unavailable treatments are
  proposals, not approved specimens.
- Empty workflows and resources screenshots used `/preview` with the scenario
  panel hidden. Statistics and running-task verification use `/` to avoid the
  preview-grid capture trap described above.
- No approved specimen for over-limit, permission-denied, or unsupported harness
  semantics; those were not invented in UI or fixtures.
- Statistics “All time” incomplete retained-history treatment is intentional and
  not a claim of visual approval for an all-time populated specimen.
- No public ctl statistics or transcript contract; success rate / median / cost
  and transcript blocks are fixture facts with explicit coverage gates.
- Running-, failed-, and completed-task captures omit specimen right-pane /
  more-actions chrome (out of scope). Completed captures therefore do **not**
  claim full `task/done` specimen coverage.
- Completed summary / tool results are fixture-reported evidence only.
