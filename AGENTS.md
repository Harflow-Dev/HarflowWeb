# HarflowWeb

Self-hosted web application and future server. Owns its entire frontend; do not
recreate HarflowClient or HarflowDesktop.

## Current state

This repository contains an **exploratory mock-backed new-task + workflows +
resources + statistics overview slice** for review. It is not W01–W05 completion,
production Web, authentication, or a real engine connection. Production roadmap
remains native Mac + Rust first; Web later.

## Working rules

- Read `docs/migration-plan.md` and `docs/migration-sessions.md` before expanding
  scope. Plans do not authorize live operations or publication.
- Prefer the clean architecture layers under `src/` (`model`, `application`,
  `presentation`, `components`, `features`, `adapters/mock`, `composition`).
- Concrete mock adapters may be constructed only in `src/composition/`.
- Builds and tests must not depend on sibling checkouts.
- Design citations use HarflowDesign commit/path/state. Hosted
  `https://design.harflow.dev/v2` is convenient for visual inspection; pin the
  immutable commit for provenance.
- Preserve existing uncommitted work. Do not merge, deploy, or publish without
  explicit authorization.
