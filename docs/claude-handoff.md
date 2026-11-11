# Session handoff — HarflowWeb

Implementation is paused. This file is a session handoff, not product
documentation. Do not start another feature, push, deploy, or publish from
this note.

- Written: 2026-11-11
- Repository: `/Users/Shared/Code/Harflow/HarflowWeb`
- Branch: `main`
- HEAD at handoff: `722ca31fa65520b830766096c3dc4578bb20beea` (plus the commit
  that adds this file)
- Tracking: `main` is ahead of `origin/main`. Nothing from 2026-11-06 onward
  has been pushed. Pushing requires the owner's authorization.
- Working tree: clean

## What this repository is

HarflowWeb is an exploratory mock-backed frontend slice for review. It is not
W01–W05 completion, production Web, authentication, or a real engine
connection. The production roadmap is native Mac and Rust first; Web follows.

Read `AGENTS.md`, `docs/architecture.md`, `docs/migration-plan.md` and
`docs/migration-sessions.md` before expanding scope. Clean layers under
`src/`: `model`, `application`, `presentation`, `components`, `features`,
`adapters/mock`, `composition`. Construct concrete mock adapters only in
`src/composition/`. Builds and tests must not depend on sibling checkouts.

## Last completed slice: first-load skeletons

Approved design: HarflowDesign `9d19fd70cc385c551004db4a8054cc85dc93fe86`
(“Approve the loading states”), drawings in `v2/scripts/skeleton-specs.js`,
`screens-loading-work.js` and `screens-loading-more.js`. Per-state citations
are in `docs/provenance.md`.

| Commit | Purpose |
| --- | --- |
| `a32db38` | Skeletons for New task, Sidebar and Task |
| `3abbdf3` | Skeletons for Workflows, editor, run and Parallel group |
| `d2270b8` | Skeletons for Resources, Statistics and Settings |
| `df20845` | Provenance and preview coverage docs |
| `004106d` | Review fixes: editor Back while loading, Settings General observation port, harness expansion state, mid-load navigation tests |
| `46ec345` | Docs for the review fixes |
| `943f36e` | StatusRegion announces first loads; tighter skeleton semantics |
| `722ca31` | Announce whichever of submission outcome and first load changed last |

The first three commits were written in Cursor. The rest came from a Claude
implementer after review.

Review: two rounds with Opus, Codex (gpt-6-astra) and Vibe. All three approved
or had only minor findings left, and those were fixed. Codex ran on the
regular Codex backend in both rounds because the OpenAI API key had no
credits.

Checks at `722ca31`: `npm run verify` passes (architecture check, 356 tests,
build); `npm run lint` reports zero warnings.

### Behaviour worth knowing

- Every loading state is selectable in `/preview` (catalog in
  `src/adapters/mock/scenarioCatalogLoading.ts`). Each is driven by a deferred
  mock observation, not a component flag.
- Settings › General has its own observation (`observeSettingsGeneral`,
  `SettingsGeneralSession`). Loading and ready share one structure; the theme
  control is never remounted.
- The expanded harness in Settings › Harnesses is session state
  (`harnesses.expandedId`). It persists across navigation, and a ready
  observation that no longer lists it collapses it.
- `StatusRegion` is the only polite live region. It announces the main
  screen's loading label (`src/features/mainLoadingLabel.ts`) or a submission
  outcome, whichever changed most recently. Skeleton labels are plain hidden
  text.
- Mid-load navigation and late delivery are covered in
  `src/features/MidLoadNavigation.test.tsx`, including a table test that
  boots every loading scenario through `PreviewShell`.

### Deliberate deviations from the drawings

- The task loading top bar shows the real task title. The owner decided that
  titles show while loading; the HarflowDesign drawing is still owed.
- The MCP approvals skeleton places its placeholder under the first row only,
  because the real page expands one harness at a time. The drawing places one
  under every row.

### Not done in this slice

- Skipped approved states: `task/loading-pane`, `menu-bar/loading`, the
  1000 × 620 minimum-window variants, partial loads
  (`task/changes-loading`, `events-loading`, `artifacts-loading`,
  `sidebar/history-older`, `new-task/centered-loading`), app-states and
  harness-runtime first loads.
- Light and dark captures at 1280 × 800 were not archived. A spot check of
  task, resources and settings › harnesses against the drawings found them
  close. See `docs/visual-validation.md` for where captures belong.

## Candidate next work

These are options, not assignments. The owner chooses.

1. Pending launches (21 states approved 2026-11-10, pinned at HarflowDesign
   `83d820f57e6ec2d82cccd3a1e335128332fdb672`; decision record
   `v2/docs/decisions/pending-launch-discovery.md`). It carries API mapping
   and Stop semantics, so it is not a good fit for Cursor.
2. The skipped loading states above, starting with the minimum-window
   variants of screens that already exist.
3. The starting state without a status row (`new-task/centered-starting-plain`,
   approved at HarflowDesign `76ad937`).

Before starting, check HarflowDesign for approvals newer than these commits.

## Rules for the next session

1. Preserve uncommitted work. Do not revert the commits above.
2. Cite design commit, path and state for each new screen.
3. Loading and error states come from mock observations selectable in
   `/preview`, never from flags in components or fields added to domain
   types for the mock's sake.
4. Add a focused regression test before calling a change done.
5. Run `npm run verify` and `npm run lint` (zero warnings).
6. Commit cohesive stages locally. Do not push unless the owner asks.
