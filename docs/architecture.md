# Architecture map — new-task mock slice

## Layers

| Layer | Responsibility | May depend on |
| --- | --- | --- |
| `src/model` | Pure values, ids, outcomes | nothing |
| `src/application` | `EnginePort`, use cases | model |
| `src/presentation` | Presenter + immutable screen state | application, model |
| `src/components` | Presentational React | model, presentation types |
| `src/features` | React composition + presenter lifetime | presentation, components, application interfaces |
| `src/adapters/mock` | Deterministic `EnginePort` | application interfaces, model |
| `src/composition` | Wires mock → use cases → presenter | all (sole concrete adapter construction) |

Public entry points are each layer’s `index.ts`. Deep imports across layers are
avoided; `scripts/check-architecture.mjs` fails on forbidden directions, mock
imports outside composition, and I/O/React in pure layers. Size limits: target
250 / max 400 substantive lines per file; target 50 / max 80 per function.

A green import check does **not** prove semantic architecture correctness.

## EnginePort (slice-sized)

- `observeContext(onUpdate) → ObservationHandle` — composer + sidebar load
- `startTask(request) → Promise<StartTaskOutcome>` — accepted | refused | unknown
- `ObservationHandle.cancel()` — dispose outstanding observations

No shell commands, generic RPC, or “call operation” methods.

## Future production path (not implemented)

Browser → authenticated Web server → public `harflow-ctl`. The browser never
invokes ctl, agent MCP, or engine SQLite/private files directly.
