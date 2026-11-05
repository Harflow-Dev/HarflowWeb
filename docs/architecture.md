# Architecture map — exploratory mock slices

## Layers

| Layer | Responsibility | May depend on |
| --- | --- | --- |
| `src/model` | Pure values, ids, outcomes | nothing |
| `src/application` | `EnginePort`, use cases | model |
| `src/presentation` | Presenters + immutable screen state | application, model |
| `src/components` | Presentational React | model, presentation types |
| `src/features` | React composition + presenter lifetime | presentation, components, application interfaces |
| `src/adapters/mock` | Deterministic `EnginePort` | application interfaces, model |
| `src/composition` | Wires mock → use cases → presenter | all (sole concrete adapter construction) |

Public entry points are each layer’s `index.ts`. Deep imports across layers are
avoided; `scripts/check-architecture.mjs` fails on forbidden directions, mock
imports outside composition, and I/O/React in pure layers. Size limits: target
250 / max 400 substantive lines per file; target 50 / max 80 per function.

A green import check does **not** prove semantic architecture correctness.

## App shell

`AppPresenter` / `AppSession` owns:

- route (`new-task` | `workflows`)
- new-task child session (draft, selections, appearance, sidebar collapse, launch)
- workflows child session (definition list observation)

Navigating does **not** dispose either child. In-flight launches keep applying;
returning to New task shows the current pending/accepted/refused/unknown state
without resubmitting. Appearance and sidebar collapse live on the new-task
session and remain shared chrome for both routes.

## EnginePort (slice-sized)

- `observeContext(onUpdate) → ObservationHandle` — composer + sidebar load
- `observeWorkflows(onUpdate) → ObservationHandle` — workflow definition summaries
- `startTask(request) → Promise<StartTaskOutcome>` — accepted | refused | unknown
- `ObservationHandle.cancel()` — dispose outstanding observations

No shell commands, generic RPC, or “call operation” methods. Workflows are
definitions (title, description, node count) — not runs and not run status.

## Future production path (not implemented)

Browser → authenticated Web server → public `harflow-ctl`. The browser never
invokes ctl, agent MCP, or engine SQLite/private files directly.
