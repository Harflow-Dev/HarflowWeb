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

Earlier new-task screenshots remain under
`~/.codex/workflows/screenshots/2026-11-05-harflowweb-new-task-slice/`.

## Design provenance for this inspection

- HarflowDesign commit `3643d083700be4032c93237813b573d04bab6ab1`
- Workflows: `v2/scripts/screens-workflows.js` (`workflows/list`, `workflows/empty`)
- Resources: `v2/scripts/screens-resources.js` (`resources/slots` light/dark)
- Observed in the running Vite app (not substituted from hosted design)

## Checks performed

- Keyboard: New task / Workflows / Resources are buttons; task destinations and
  Install announce unavailable in accessible names.
- Focus: theme and nav controls remain operable after route changes; Resources
  nav can take `aria-current` focus.
- Overflow: recent work scrolls in the sidebar; resources page fits 1280×800
  without document-level horizontal overflow.
- Product search omitted per accepted coverage ledger.
- Empty workflows specimen copy verified (`No workflows yet` + create CTAs).
- Resources shows populated, full-with-waiters, zero-holder, and not-installed
  cards plus the waiting list from the approved specimen.

## Limitations

- Pixel fidelity to native materials is not claimed.
- Workflows/resources loading and unavailable treatments are proposals, not
  approved specimens.
- Empty workflows and resources screenshots used `/preview` with the scenario
  panel hidden.
- No approved specimen for over-limit, permission-denied, or unsupported harness
  semantics; those were not invented in UI or fixtures.
