# Deferred web host migration checklist

Status: planned, 2026-11-02. All work items remain unverified.

This repository is reserved for a future self-hosted web application and
server. It has no implementation today. The migration does not depend on Web;
this document authorizes planning only, not login, triggers or server work.

## Dispatch and boundaries

Work only on the assigned item. Read the workspace AGENTS.md, this repository's AGENTS.md if present, and
applicable package instructions first; preserve concurrent edits and use primary checkouts.
The orchestrator delegates unit tests under the current workflow. A checkbox is
not authorization to start runtimes, mutate real roots, register clients, push,
release, clean up, or expand scope. Use disposable roots and workspaces where
needed. Report a blocker with concrete evidence; task status is not proof of
completion. Repository builds and tests must not depend on sibling checkouts.

The optional [workspace coordination index](../../HARFLOW_MIGRATION_CHECKLIST.md)
uses B0 (baseline), C0 (contracts and design), E0 (client and Electron on
Python), R0 (Rust parity), I0 (integrated stack), and O0 (owner cutover and
publication). It is not a build dependency. Freeze and qualify the reproducible
existing baseline without waiting for open feature tickets. Review v1 scope in a
parity ledger, including proposed sidebar additions, instead of assuming tickets
or UI polish are migration requirements without an accepted ledger decision. All boxes below are deliberately unchecked;
scaffolds alone do not establish completion. Early-use gates and defaults remain
subject to evidence and explicit authorization for root registration. Use fresh
Rust state; archive historical task, run and event records rather than importing
them. Import only definitions, configuration and preferences, with an explicit
registration backup and handoff. No engine may share a writable root.

Stage dependencies: B0 → C0 → E0 → R0 → I0 → O0 describe workspace
coordination only; Web is deferred and does not gate those stages.

## B0 / C0 — scope and boundaries

- [ ] B0-WE-01 Record the empty repository baseline and the accepted deferred
      status in the shared parity ledger.
- [ ] C0-WE-01 Define future browser-host responsibilities around the same
      shared client ports and public engine interface.
- [ ] C0-WE-02 Document a future authenticated HTTP server adapter and authority
      and idempotency decisions as prerequisites for any implementation.
- [ ] C0-WE-03 Keep Electron APIs and private engine database access outside the
      browser host and server contract.

## E0 / later — optional evidence and future work

- [ ] E0-WE-01 If assigned, demonstrate browser consumption of the shared
      package with a static fake-port harness, without a production server.
- [ ] O0-WE-01 Record separately authorized future server, login, webhook and
      scheduling work; none blocks the Electron/Python or Rust gates.
- [ ] O0-WE-02 Before future implementation, define independent packaging,
      validation, deployment and security requirements and obtain scope approval.

## Validation

No implementation or test commands exist in this repository yet. Validate this
plan's links and checklist structure. A future fake-port proof should report its
commands and evidence without starting a production service.

## Handoff evidence

For every assigned item report: item ID and result; repository and dependency
commit IDs; fixture manifest hash where applicable; commands, environment,
results and evidence locations; local, committed, pushed, CI-passed, packaged
and released state, stated separately; approved design commit, path and state where
applicable; deviations, blockers and remaining work. Record unrun checks and
why. Do not infer passing gates from a dispatched task's status.
