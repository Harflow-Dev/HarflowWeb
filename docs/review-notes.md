# Review notes — exploratory new-task + workflows slice

## Intent

Review checkpoint only. Stopped after the workflows list/empty mock slice. Does
not complete W01–W05, authenticate, connect a real engine, run workflows, or ship
editor/run destinations.

## Known deviations

- Loading / unavailable / partial-sidebar treatments are **proposals** requiring
  design review; they are not approved specimens.
- Workflows loading/unavailable copy is likewise a **proposal**, not an approved
  specimen.
- Specimen copy “Choices are remembered per repository” is not implemented;
  selection is one global set for the mock session.
- Narrow-width layout is a responsive proposal; desktop specimens are approved at
  1280×800.
- Sidebar destinations outside New task and Workflows stay unavailable.
- Run, Edit, New workflow, and “Describe one to an agent” are visible per design
  and explicitly unavailable in this slice — no run/editor screens.
- Workflows list shows definition title, description, and node count only — no
  invented run status (matches screen-inventory note).
- Product search is deliberately omitted (coverage ledger: remove product search /
  sidebar harness filter). The pinned `workflows/list` specimen still shows a
  search field; Web follows the accepted removal, not that older control.
- Accepted submission reports a synthetic task id in the status region only.
- Hosted design site may include material newer than pinned commit `3643d083…`.
- `migration-coverage.md` missing at the pinned design commit.

## Unresolved questions

- Exact public ctl projection for repositories and workflow definitions on a
  future server.
- Whether harness fixture labels should track live backend qualification names or
  remain design specimen copy.
- Adaptive browser states for loading/error need owner-approved v2 specimens
  before claiming design fidelity.

## What this does not claim

Production readiness, authentication, real engine compatibility, workflow
execution/editing, Linux runtime support, or migration-gate completion.
