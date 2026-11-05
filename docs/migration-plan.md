# Later full Web application and server checklist

Revised 2026-11-04. Governing [revision 3](../../HARFLOW_MIGRATION_PLAN_V3.md),
[workspace gates](../../HARFLOW_MIGRATION_CHECKLIST.md) and [current sessions](migration-sessions.md).

HarflowWeb owns its entire browser frontend and server. There is no shared
HarflowClient dependency and no Electron host. Work starts after stable Mac/Rust
observation and a separately authorized Web phase; it does not block Mac cutover.
Linux accesses Web, while its engine/server runtime needs independent qualification.

- [ ] W01 Decide frontend/server boundaries, authenticated HTTP/session/CSRF/origin
  and responder authority, idempotent starts/unknown recovery, filesystem semantics,
  engine/service deployment, triggers/schedules/deliveries/Incoming and Web scope.
- [ ] W02 Qualify Linux Rust process/authority/runtime, service lifecycle, distribution
  and recovery; browser-only checks do not establish engine support.
- [ ] W03 Build all frontend models/ports/presentation/components here, approved
  adaptive UI and authenticated server adapter using only public engine interface.
- [ ] W04 Complete scoped features/security/browser/accessibility/performance and
  deployment evidence; external deployment needs current authorization.
- [ ] W05 Agree and complete stability observation; explicit owner acceptance
  before opening any later native Windows app work.

Browser uses authenticated HTTP; the Web server invokes public harflow-ctl, not
engine MCP as its product API. Missing ctl operations start in the current canonical
owner: HarflowMCP before accepted O04 transfer, HarflowEngine afterward. Specify
provenance/authority/bounds/unknown semantics, capabilities, fixtures and tests, then
coordinate byte-identical consumer fixtures and adapters. Web after transfer has no
dependency on retired Python. Browser cannot
directly invoke ctl or inspect engine SQLite/private persistence.
Engine APIs retain execution/authority semantics across browser and native clients.
No production server, login, trigger or deployment is implemented by this plan.

## Boundaries and evidence

This plan authorizes no implementation by itself. Follow workspace/child/package
AGENTS.md and the current session brief; preserve concurrent work in primary
checkouts. Use isolated roots/fixtures. No implicit live-state, install, registration,
paid-probe, signing, push, publication, retirement or deletion authority. Record exact
commit/contract/design/runtime/profile identities, actual checks/reviews, missing
coverage and owner decisions in the lead receipt. Delivery and acceptance differ.
Builds/tests must not depend on sibling source checkouts. Documentation-only plan
changes need link/consistency checks, not product test reruns.
