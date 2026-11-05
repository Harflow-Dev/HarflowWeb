# Review notes — exploratory mock slices

## Intent

Review checkpoint after the mock-backed completed-task Changes pane
(completed-task transcript/summary committed first). Does not complete W01–W05,
authenticate, connect a real engine, run workflows, administer slots, bill,
submit follow-ups, retry, apply patches, or ship editor/run destinations.

## Known deviations

- Loading / unavailable / partial-sidebar treatments are **proposals** requiring
  design review; they are not approved specimens.
- Workflows/resources/statistics/task loading and unavailable copy are
  **proposals**, not approved specimens.
- Specimen copy “Choices are remembered per repository” is not implemented;
  selection is one global set for the mock session.
- Narrow-width layout is a responsive proposal; desktop specimens are approved at
  1280×800.
- Sidebar destinations outside New task, Workflows, Resources, Statistics, and
  explicitly mapped running-task rows stay unavailable.
- Run, Edit, New workflow, “Describe one to an agent”, Resources task links,
  Install, follow-up send, Stop (running only), Retry, and Copy resume command
  are visible per design and explicitly unavailable in this slice — no
  run/editor/admin/steering screens, no generated shell commands, and no
  mutation from those controls.
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
- Running-task view implements `task/running`: slim header, transcript,
  expandable tools, working indication, follow-up composer shell with Stop.
- Failed-task view implements `task/failed`: failed badge, diagnostic transcript,
  failure explanation banner; no running badge, working indicator, or Stop.
  Retry / Copy resume / follow-up send stay unavailable.
- Completed-task view implements `task/done` transcript + summary + **read-only
  Changes pane**: done badge, diagnostic transcript, Summary separator/body,
  follow-up send unavailable; no Stop, failure banner, or Retry. Toggle opens
  the Changes pane with fixture file rows, counts, selected path, and literal
  diff lines. File selection keeps the list mounted and clears the prior diff
  while the new observation loads. Navigating to another task closes the pane
  immediately (no unclosable open pane on running/failed). Artifacts and Events
  tabs announce unavailable. No Git, patch apply, edit, download, or external
  links.
- Summary, tool outcomes, and Changes diffs are fixture-reported / recorded
  observations only; they do not claim independently verified authorship or
  working-tree proof. Change evidence is independent of task success.
- No task-level Summary/Prompt tabs, product search, artifact browser, approval
  cards, or workflow-run destinations. More-actions chrome remains omitted.
- Only rows with `mappedTaskId` open a transcript. Synthetic launch-accepted ids
  remain unmapped unless an explicit fixture exists.
- Product search is deliberately omitted (coverage ledger: remove product search /
  sidebar harness filter). Statistics range selection is retained. Task-level
  Summary/Prompt tabs remain removed (prompt is the first transcript message).
- Accepted submission reports a synthetic task id in the status region only.
- Hosted design site may include material newer than pinned commit `3643d083…`.
- `migration-coverage.md` missing at the pinned design commit.
- Prior Workflows screenshots named `*-1280x800.png` under
  `~/.codex/workflows/screenshots/2026-11-05-harflowweb-workflows-slice/` are
  actually **1150×1360**; verified 1280×800 captures live in that directory’s
  `verified-1280x800/` subdirectory (see `docs/visual-validation.md`).

## Unresolved questions

- Exact public ctl projection for repositories, workflow definitions,
  resource/slot observation, statistics aggregates, and task transcripts on a
  future server.
- Whether harness fixture labels should track live backend qualification names or
  remain design specimen copy.
- Adaptive browser states for loading/error need owner-approved v2 specimens
  before claiming design fidelity.
- Whether not-installed Install should remain visible-but-unavailable or wait for
  an approved install flow before appearing in product Web.
- Accepted engine semantics for success rate, median duration, and reported cost
  once a public statistics contract exists.
- Whether a later slice should restore specimen right-pane toggles as unavailable
  chrome or wait for an approved Changes/Artifacts design.

## What this does not claim

Production readiness, authentication, real engine compatibility, workflow
execution/editing, slot administration, billing accuracy, follow-up/retry
execution, Linux runtime support, or migration-gate completion.
