# Visual validation — exploratory slices

Screenshots stored outside the repository:

`~/.codex/workflows/screenshots/2026-11-05-harflowweb-workflows-slice/`

| File | Scenario | Size | Appearance |
| --- | --- | --- | --- |
| `01-workflows-list-light-1280x800.png` | workflows/list | 1280×800 | light |
| `02-workflows-list-dark-1280x800.png` | workflows/list | 1280×800 | dark |
| `03-workflows-empty-light-1280x800.png` | workflows/empty (preview scenario; panel hidden) | 1280×800 | light |
| `04-workflows-empty-dark-1280x800.png` | workflows/empty (preview scenario; panel hidden) | 1280×800 | dark |

Earlier new-task screenshots remain under
`~/.codex/workflows/screenshots/2026-11-05-harflowweb-new-task-slice/`.

## Design provenance for this inspection

- HarflowDesign commit `3643d083700be4032c93237813b573d04bab6ab1`
- `v2/scripts/screens-workflows.js` states `workflows/list` and `workflows/empty`
- Observed in the running Vite app at 1280×800 (not substituted from hosted design)

## Checks performed

- Keyboard: sidebar New task / Workflows are buttons; Run/Edit announce unavailable
  in accessible names.
- Focus: theme and nav controls remain operable after route changes.
- Overflow: recent work scrolls in the sidebar; list rows keep Edit/Run.
- Product search omitted per accepted coverage ledger (not restored from the older
  `workflows/list` specimen control).
- Empty specimen copy verified in DOM (`No workflows yet` + both create CTAs).

## Limitations

- Pixel fidelity to native materials is not claimed.
- Workflows loading/unavailable are proposals, not approved specimens.
- Empty screenshots were taken from `/preview` with the scenario panel hidden; list
  screenshots used the main `/` route.
