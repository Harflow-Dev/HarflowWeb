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
running badge, or working indicator. Pane closed in these captures. Document
scrollWidth equals clientWidth (1280).

## Completed-task Changes pane — verified 1280×800 captures

Directory:
`~/.codex/workflows/screenshots/2026-11-05-harflowweb-task-changes-slice/`

Captured from `/` after opening the completed Recent row and toggling the right
pane open (and a closed counterpart). Same CDP clip + `sips` verification.

| File | Scenario | Viewport / PNG | Appearance / chrome |
| --- | --- | --- | --- |
| `01-task-changes-open-light-expanded.png` | task/done Changes open | 1280×800 | light, sidebar expanded |
| `02-task-changes-open-dark-expanded.png` | task/done Changes open | 1280×800 | dark, sidebar expanded |
| `03-task-changes-open-dark-collapsed.png` | task/done Changes open | 1280×800 | dark, sidebar collapsed |
| `04-task-changes-closed-light-expanded.png` | task/done Changes closed | 1280×800 | light, sidebar expanded |
| `05-task-changes-open-light-expanded-fix.png` | task/done Changes open (post-fix) | 1280×800 | light, sidebar expanded |
| `06-task-changes-config-light-expanded.png` | task/done `config.py` selected | 1280×800 | light, sidebar expanded |
| `07-task-changes-config-dark-expanded.png` | task/done `config.py` selected | 1280×800 | dark, sidebar expanded |

Observed with pane open: Changes tab with count 3, three file rows with +/−
counts, selected file caption and hunk/add/del diff lines, Artifacts and
Events tabs present. `05` shows default `queue.py`; `06`/`07` show
`harflow_web/config.py` after selection (queue diff absent). Transcript column
remains visible beside the pane; document scrollWidth equals clientWidth
(1280). Closed capture confirms toggle restores the full-width transcript.
File selection keeps the file list mounted (focus retained) while clearing the
prior diff; navigating to a running task closes the pane (no toggle, no pane)
so running/failed never leave an unclosable Changes surface.

## Settings general — verified 1280×800 captures

Directory:
`~/.codex/workflows/screenshots/2026-11-06-harflowweb-settings-general/`

Captured from `/` after opening Settings from the sidebar footer. Same CDP clip
+ `sips` verification. Appearance is the shared session theme (not persisted).

| File | Scenario | Viewport / PNG | Appearance / chrome |
| --- | --- | --- | --- |
| `01-settings-general-light-expanded.png` | settings/general | 1280×800 | light, sidebar expanded |
| `02-settings-general-dark-expanded.png` | settings/general | 1280×800 | dark, sidebar expanded |

Observed: Settings heading, General selected and Harnesses present, Appearance
theme control, behaviour rows, runtime “0.9.3 is ready”, and task-store facts.
Document scrollWidth equals clientWidth (1280). Focus stays on the activated
theme control. Behaviour, update, and store controls do not change saved state.

## Settings harnesses — verified 1280×800 captures

Directory:
`~/.codex/workflows/screenshots/2026-11-06-harflowweb-settings-harnesses/`

Captured from `/` after Settings → Harnesses. Same CDP clip + `sips`
verification. Appearance is the shared session theme.

| File | Scenario | Viewport / PNG | Appearance / chrome |
| --- | --- | --- | --- |
| `01-settings-harnesses-light-expanded.png` | settings/harnesses | 1280×800 | light, sidebar expanded |
| `02-settings-harnesses-dark-expanded.png` | settings/harnesses | 1280×800 | dark, sidebar expanded |

Observed: Harnesses tab selected, fixture server path with the “not this
computer” caption, five harness rows, and the qualification section. Document
and the settings scroller have equal scroll and client sizes (no overflow).
Light capture focus is the Harnesses tab. Dark capture focus is the sidebar
Dark control; the Harnesses tab stays selected. Refresh, MCP approvals, Update,
and Remove are disabled. The MCP approvals editor is not shown. Loading and
unavailable harness copy have no approved specimen.

Earlier new-task screenshots remain under
`~/.codex/workflows/screenshots/2026-11-05-harflowweb-new-task-slice/`.

## Needs you — verified 1280×800 captures

Directory:
`~/.codex/workflows/screenshots/2026-11-06-harflowweb-needs-you/`

Waiting captures are from `/` after Needs you. Empty captures are the app
column of `/preview` scenario `needs-you-empty` (viewport 1560×800, clip
x=280 so the PNG is the 1280×800 app and omits the scenario panel). `sips`
reports 1280×800 for every file. Appearance is the shared session theme.

| File | Scenario | Viewport / PNG | Appearance / chrome |
| --- | --- | --- | --- |
| `01-needs-you-waiting-light-expanded.png` | needs-you/waiting | 1280×800 | light, sidebar expanded |
| `02-needs-you-waiting-dark-expanded.png` | needs-you/waiting | 1280×800 | dark, sidebar expanded |
| `03-needs-you-empty-light-expanded.png` | needs-you/empty | 1280×800 | light, sidebar expanded |
| `04-needs-you-empty-dark-expanded.png` | needs-you/empty | 1280×800 | dark, sidebar expanded |

Observed waiting: heading Needs you, badge “3 waiting”, sidebar count 3, three
cards (command approval, publish approval, question). The Nightly running row
keeps its attention glyph and is not added to the count. Document and the page
scroller have equal scroll and client sizes (no overflow). Light focus is the
Light control. Dark focus is the Dark control. Approve, Reject, Send, reply,
and Open run are disabled. Mapped Open task stays available.

Observed empty: heading only, no sidebar count, “Nothing needs you” plus the
approved sentence. No “3 waiting”. Document scrollWidth equals clientWidth
(1280) on the preview page; the clipped app column is 1280×800. Focus is the
activated theme control. Loading, unavailable, and partial states have no
approved specimen and were not captured as specimens.

## Workflow run — verified 1280×800 captures

Directory:
`~/.codex/workflows/screenshots/2026-11-06-harflowweb-workflow-run/`

Captures are from `/` after Workflows → Run on Release checklist. `sips`
reports 1280×800. Appearance is the shared session theme. Menus are closed
and Goal is expanded, matching `workflows/run`.

| File | Scenario | Viewport / PNG | Appearance / chrome |
| --- | --- | --- | --- |
| `01-workflows-run-light-expanded.png` | workflows/run | 1280×800 | light, sidebar expanded |
| `02-workflows-run-dark-expanded.png` | workflows/run | 1280×800 | dark, sidebar expanded |

Observed: heading “Run Release checklist”, the specimen Task and Goal text,
repository HarflowMCP, “Orchestrator: saved”, and the two permission lines
plus the fixture caption. Document scrollWidth equals clientWidth (1280).
The page scroller is 1016×756 and equals its client size (no overflow).
Goal collapse removed the textarea and reopening restored the same text;
focus stayed on Goal (optional). The saved orchestrator menu item accepted
focus. Custom orchestrator was disabled. The HarflowMac repository menu item
accepted focus; the menu was closed without changing the selection. Dark
capture focus is the Dark control. The Run control stays disabled. Loading,
validation, error, and adaptive states have no approved specimen and were
not captured as specimens.

## Workflow editor — verified 1280×800 captures

Directory:
`~/.codex/workflows/screenshots/2026-11-06-harflowweb-workflow-editor/`

Captures are from `/` after Workflows → Edit on Release checklist, with Review
selected. `sips` reports 1280×800. Appearance is the shared session theme.

| File | Scenario | Viewport / PNG | Appearance / chrome |
| --- | --- | --- | --- |
| `01-workflow-editor-light-expanded.png` | earlier capture, End clipped | 1280×800 | light, sidebar expanded |
| `02-workflow-editor-dark-expanded.png` | earlier capture, End clipped | 1280×800 | dark, sidebar expanded |
| `03-release-routed-light-end.png` | Release scrolled to End | 1280×800 | light, sidebar expanded |
| `04-nightly-routed-light-loop.png` | Nightly dashed loop | 1280×800 | light, sidebar expanded |
| `05-nightly-routed-dark-loop.png` | Nightly dashed loop | 1280×800 | dark, sidebar expanded |
| `06-release-routed-dark-end.png` | Release scrolled to End | 1280×800 | dark, sidebar expanded |

`01` and `02` remain as the captures from before the canvas scrollport. Use
`03`–`06` for reachability.

Observed on `03` and `06`: title “Release checklist”, meta “Revision 7”,
standalone Orchestrator (locked), Security reviewer, and Docs checker. The
canvas is scrolled so End, Review, both Checks nodes, Implement changelog,
and Run tests are visible, with open chevrons. Start is off the left of the
scrollport in these End captures and comes back into view at scroll position
0. Release has no dashed loop. The inspector shows Review after the scroll,
including the instructions sentence, Claude Code, Opus 5.5, High, and a
disabled Optional switch. The footer reads “8 path nodes · 2 on demand”.
Document scrollWidth equals clientWidth (1280) and scrollHeight equals
clientHeight (800). The scrollport is 665×626, `overflow: auto`,
`scrollbar-width: thin`. At the end of the range, `scrollLeft` is 73 of 84.
End’s box is inside the port (right edge about 923, port right 940). The
computed scrollbar color is tertiary at 72% opacity: light
`color(srgb 0.373 0.376 0.396 / 0.72)`, dark
`color(srgb 0.678 0.678 0.702 / 0.72)`. The inspector body uses the same
class, `overflow: auto`, and the same color. Review stays selected.

Observed on `04` and `05`: Nightly dependency audit, Revision 2. Start, Audit
lockfiles, and End are all inside the port (content size equals the port).
The dashed loop under Audit lockfiles has `stroke-dasharray: 6, 4` and its
path numbers stay non-negative (minimum 99). Selecting End moves the
inspector to End and leaves focus on that node. The footer reads
“3 path nodes · 1 on demand”.

The canvas port accepts focus. A synthetic Left key from the browser tool
did not move `scrollLeft`; that tool dispatches an untrusted DOM event, so
it does not exercise the browser’s native arrow-key scrolling. The port
does not intercept keys. The existing Mock engine badge overlaps the
disabled Run control. Loading, error, and adaptive editor states have no
approved specimen and were not captured as specimens.

## Design provenance for this inspection

- HarflowDesign commit `3643d083700be4032c93237813b573d04bab6ab1`
- Workflows: `v2/scripts/screens-workflows.js` (`workflows/list`, `workflows/empty`)
- Resources: `v2/scripts/screens-resources.js` (`resources/slots` light/dark)
- Statistics: `v2/scripts/screens-statistics.js` (`statistics/overview` light/dark)
- Task: `v2/scripts/screens-task.js` (`task/running`, `task/failed`, and
  `task/done` transcript+summary+Changes light/dark)
- Settings: `v2/scripts/screens-settings.js` (`settings/general` and
  `settings/harnesses` light/dark)
- Needs you: `v2/scripts/screens-needs-you.js` (`needs-you/waiting` and
  `needs-you/empty` light/dark)
- Workflow run: `v2/scripts/screens-workflows.js` (`workflows/run` light/dark)
- Workflow editor: `v2/scripts/screens-workflow-editor.js`
  (`workflow-editor/node-selected` light/dark)
- Observed in the running Vite app (not substituted from hosted design)

## Checks performed

- Keyboard: New task / Needs you / Workflows / Resources / Statistics / Settings
  are buttons;
  unmapped task destinations and Install announce unavailable in accessible names.
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
- Workflows/resources/statistics/task/Needs you loading, unavailable, and
  partial treatments are proposals, not approved specimens. Workflow run
  loading, validation, error, and adaptive states are the same: proposals,
  not approved specimens. Workflow editor loading, error, and adaptive
  states are proposals, not approved specimens. At 1280×800 the scaled
  Release checklist board is wider than the visible canvas. The inner
  scrollport reaches End; `01` and `02` still show the earlier clipped frame.
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
