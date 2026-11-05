# Review notes — exploratory new-task + workflows + resources + statistics slice

## Intent

Review checkpoint only. Stopped after the mock-backed Statistics overview slice.
Does not complete W01–W05, authenticate, connect a real engine, run workflows,
administer slots, bill, or ship editor/run destinations.

## Known deviations

- Loading / unavailable / partial-sidebar treatments are **proposals** requiring
  design review; they are not approved specimens.
- Workflows/resources/statistics loading and unavailable copy are **proposals**,
  not approved specimens.
- Specimen copy “Choices are remembered per repository” is not implemented;
  selection is one global set for the mock session.
- Narrow-width layout is a responsive proposal; desktop specimens are approved at
  1280×800.
- Sidebar destinations outside New task, Workflows, Resources, and Statistics
  stay unavailable.
- Run, Edit, New workflow, “Describe one to an agent”, Resources task links, and
  Install are visible per design and explicitly unavailable in this slice — no
  run/editor/admin screens and no mutation from those controls.
- Workflows list shows definition title, description, and node count only — no
  invented run status (matches screen-inventory note).
- Resources shows slot usage, holders, and waiters only — no over-limit,
  permission-denied, unsupported, release, repair, or configuration semantics.
- Statistics shows fixture overview totals for typed ranges only. Success rate
  and median duration are fixture facts when coverage is complete. Incomplete
  coverage is sanitized in presentation so reported success/median cannot reach
  the UI. There is no public ctl statistics contract in this slice.
- “All time” uses incomplete retained-history coverage rather than inventing
  all-time engine totals (retained history ≠ all-time).
- Product search is deliberately omitted (coverage ledger: remove product search /
  sidebar harness filter). Statistics range selection is retained.
- Accepted submission reports a synthetic task id in the status region only.
- Hosted design site may include material newer than pinned commit `3643d083…`.
- `migration-coverage.md` missing at the pinned design commit.
- Prior Workflows screenshots named `*-1280x800.png` under
  `~/.codex/workflows/screenshots/2026-11-05-harflowweb-workflows-slice/` are
  actually **1150×1360**; verified 1280×800 captures live in that directory’s
  `verified-1280x800/` subdirectory (see `docs/visual-validation.md`).

## Unresolved questions

- Exact public ctl projection for repositories, workflow definitions,
  resource/slot observation, and statistics aggregates on a future server.
- Whether harness fixture labels should track live backend qualification names or
  remain design specimen copy.
- Adaptive browser states for loading/error need owner-approved v2 specimens
  before claiming design fidelity.
- Whether not-installed Install should remain visible-but-unavailable or wait for
  an approved install flow before appearing in product Web.
- Accepted engine semantics for success rate, median duration, and reported cost
  once a public statistics contract exists.

## What this does not claim

Production readiness, authentication, real engine compatibility, workflow
execution/editing, slot administration, billing accuracy, Linux runtime support,
or migration-gate completion.
