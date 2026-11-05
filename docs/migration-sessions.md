# HarflowWeb migration sessions — native revision 3

Revised 2026-11-04. The [workspace session index](../../HARFLOW_MIGRATION_SESSIONS.md)
is authoritative for each brief, prerequisites, acceptance and receipt output.
Read [repository checklist](migration-plan.md) and applicable guidance before work.

## Current ownership

W01–W05 only after Mac/Rust observation and explicit assignment.

- **W01 — Web scope, authority and architecture**; prerequisites and acceptance in the workspace index.
- **W02 — Linux engine and server qualification**; prerequisites and acceptance in the workspace index.
- **W03 — Web frontend and authenticated adapter**; prerequisites and acceptance in the workspace index.
- **W04 — Web product and deployment acceptance**; prerequisites and acceptance in the workspace index.
- **W05 — Web stability observation**; prerequisites and acceptance in the workspace index.

Each assignment is bounded and stops before the next. Record its lead receipt in
`docs/migration-receipts/<ID>.md`; co-owned work is included in that lead receipt.
No plan status authorizes live operations or publication. All new sessions are planned.

## Historical session evidence

S01–S09 keep their original IDs, outputs and recorded limits. S09 bounded evidence
is delivered, not accepted. Historical future S10–S50/X01–X03 are superseded and cannot be dispatched;
see the [crosswalk](../../HARFLOW_MIGRATION_PLAN_V3.md#supersession-and-scope-crosswalk).
The preserved briefs below describe original scope, not new authorization.

### S03 — Freeze, parity and scope decisions

- Status: planned. Lead: HarflowMCP. Co-owned: HarflowMac, HarflowDesign, HarflowEngine, HarflowWeb.
- Prerequisite receipts: S02.
- Checklist coverage: B0-MC-02 (final contribution), B0-MA-04 (final contribution), B0-DS-01 (final contribution), C0-DS-04 (partial), B0-EN-01 (final contribution), B0-WE-01 (partial).
- Scope and acceptance: Record Keep, Simplify, Deliberately remove and Undecided decisions in the v2 coverage ledger; obtain decisions on freeze, representative datasets and performance budgets, preserving unresolved scope and approved removals.
- Output: lead receipt `docs/migration-receipts/S03.md`, with the evidence and identities required by the dispatch protocol.
