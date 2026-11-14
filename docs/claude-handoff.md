# Session handoff — HarflowWeb

Implementation is paused. This file is a session handoff, not product
documentation. Do not start another feature, push, deploy, or publish from
this note.

- Written: 2026-11-14
- Repository: `/Users/Shared/Code/Harflow/HarflowWeb`
- Branch: `main`
- Tracking: `main` is ahead of `origin/main`. Pushing requires the owner's
  authorization.
- Working tree: clean after the commits that land this handoff

## What this repository is

HarflowWeb is an exploratory mock-backed frontend slice for review. It is not
W01–W05 completion, production Web, authentication, or a real engine
connection. The production roadmap is native Mac and Rust first; Web follows.

Read `AGENTS.md`, `docs/architecture.md`, `docs/migration-plan.md` and
`docs/migration-sessions.md` before expanding scope. Clean layers under
`src/`: `model`, `application`, `presentation`, `components`, `features`,
`adapters/mock`, `composition`. Construct concrete mock adapters only in
`src/composition/`. Builds and tests must not depend on sibling checkouts.

## Implemented families

Per-state citations live in `docs/provenance.md`. Preview catalog:
`docs/mock-scenarios.md`. Capture notes: `docs/visual-validation.md`. Open
items and deviations: `docs/review-notes.md` (summarised below; do not treat
this handoff as a second copy).

| Family | Design pin (summary) | Notes |
| --- | --- | --- |
| New task / centered composer / sidebar | `854caae` / `9d64bfd` / earlier M04 | Grow-to-cap composer; Task options; System appearance |
| Workflows / editor / run / Parallel view | approved workflow specimens + `f2a30d7` Parallel | Read-only editor; Nightly run; Graph/Parallel |
| Resources / Statistics / Settings / Needs you | baseline + harnesses | Mock observations; Settings General has its own port |
| Running / failed / completed task + Changes / Events | task specimens + transcript `854caae` | Mapped fixture ids; follow-up Send unavailable |
| First-load skeletons | `9d19fd7` | Deferred observations; `StatusRegion` announces first loads |
| Minimum window 1000 × 620 | `246cc97` | Responsive `@container hd-main`; Needs you / Parallel / workflow editor & run |
| Starting state / pane loads | `76ad937` and loading companions | Starting without status row; deferred pane loads |
| Parallel group lanes | `2153ab1` / `4ff7d83` | Titled lanes, menus, prompts, Cancel-all at app level, outcomes, minima |
| Parallel group queued messages | `2153ab1` four `lane-message*` states | Observed queue + presentation mapping; Cancel unavailable; cancelled outcome seeded |
| Pending launches | `83d820f` / approval `2934681` | Capability-gated nav; 21 states including Stop sheet and minima |
| M05 task status screen | `6e31cd7` approval | 16 fixtures + preview scenarios; `aria-disabled` commands; legacy `task-running` / `task-failed` / `task-loading` kept |

Scenario count: **129** entries in `SCENARIOS` (`SCENARIOS.length` at handoff;
re-count after adding scenarios) in `src/adapters/mock/scenarioCatalog.ts` and
the catalog modules it spreads.
Open `/preview` and use the scenario panel.

## Checks

```bash
npm run verify   # architecture + tests + build
npm run lint     # oxlint; zero warnings required
```

At handoff: **549 tests** across **64** files (`vitest run`). Re-count after
further commits.

HEAD at handoff: updated by the pending empty-body commit that follows.

## Screenshots

Stored outside the repo under `~/.codex/workflows/screenshots/`. Latest
task-status captures:
`2026-11-14-harflowweb-task-statuses/verified-1280x800/` (38 PNGs, 16 M05 states
+ `task-running` / `task-failed` / `task-loading` recaptures). Queued-message,
pending-launch, and Parallel-lane captures are sibling dated folders (see
`docs/visual-validation.md`).

The capture script is kept outside the repo. Captures use headless Chrome
(Playwright or CDP) on the built preview at the exact app frame (1280 × 800, or
the 1000 × 620 minimum frame), with the scenario panel and the “Mock engine”
badge hidden and the app frame clipped. Light and dark are captured through
`prefers-color-scheme`.

## Open items (see review-notes)

Do not expand scope from this list without an assignment. Details and
deviations are in [`docs/review-notes.md`](review-notes.md):

- Skipped approved surfaces (loading-pane, menu-bar, task minima, artifacts,
  sidebar history paging, app-states / harness-runtime loads).
- Parallel group: D21 workflow-run Parallel lanes still follow the older
  drawing; settled-lane queues and caller approvals undecided / out of scope;
  no minimum drawings for the four queued-message states.
- Pending launches: provisional queued-message/approval pending states and
  `task/launch-unknown` unchanged; documented drawing differences (stop-confirm
  lead, loading sidebar skeleton, etc.).
- Bundle size Vite warning (>500 kB); pixel fidelity to native not claimed.

## Rules for the next session

1. Preserve uncommitted work. Do not revert landed commits.
2. Cite design commit, path and state for each new screen.
3. Loading and error states come from mock observations selectable in
   `/preview`, never from flags in components or mock-only domain fields.
4. Presentation derives display; the domain holds observed facts.
5. `StatusRegion` is the only polite live region. Unavailable controls need
   aria-disabled plus an accessible explanation.
6. Run `npm run verify` and `npm run lint` (zero warnings). Prefer not to add
   avoidable architecture size warnings.
7. Commit cohesive stages locally. Do not push unless the owner asks.
