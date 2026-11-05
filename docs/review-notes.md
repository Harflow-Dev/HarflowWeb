# Review notes — exploratory new-task slice

## Intent

Review checkpoint only. Stopped after this slice. Does not complete W01–W05,
authenticate, connect a real engine, or ship destination screens.

## Independent review

Grok code-reviewer flagged status-region priority (partial sidebar swallowed
outcomes), expanded-nav `aria-disabled`, IME Enter submit, and weak accepted /
stale assertions. Those are fixed in this working tree. Sol was unavailable for
the planned Codex pass (usage limit).

## Known deviations

- Loading / unavailable / partial-sidebar treatments are **proposals** requiring
  design review; they are not approved specimens.
- Specimen copy “Choices are remembered per repository” is not implemented;
  selection is one global set for the mock session.
- Visual inspection preferred hosted `https://design.harflow.dev/v2` over a local
  design archive server.
- Narrow-width layout is a responsive proposal; desktop specimens are approved at
  1280×800.
- Sidebar destinations outside new-task are explicitly unavailable (no invented
  pages).
- Accepted submission reports a synthetic task id in the status region only; no
  task detail screen.
- Hosted design site may include material newer than pinned commit `3643d083…`.
- `migration-coverage.md` missing at the pinned design commit.
- During scaffolding, uncommitted migration doc edits were briefly reverted; they
  were restored from this session’s earlier file reads. Please confirm they match
  your intended working-tree versions.

## Unresolved questions

- Exact public ctl projection for “repositories on a future server” (browser never
  lists local directories).
- Whether harness fixture labels should track live backend qualification names or
  remain design specimen copy.
- Adaptive browser states for loading/error need owner-approved v2 specimens
  before claiming design fidelity.

## What this does not claim

Production readiness, authentication, real engine compatibility, Linux runtime
support, or migration-gate completion.
