import type { EnginePort } from '../../application'
import {
  asObservationId,
  type ContextLoad,
  type ObservationHandle,
  type StartTaskOutcome,
  type StartTaskRequest,
} from '../../model'
import { createControllablePromise, type ControllablePromise } from './controllable'
import { scenarioById, type ScenarioId } from './scenarios'

export type MockEngineControls = {
  readonly engine: EnginePort
  setScenario(id: ScenarioId): void
  /** Publish a deferred/held context update (for stale tests). */
  publishContext(load: ContextLoad): void
  /** Resolve the outstanding held startTask, if any. */
  resolveHeldStart(outcome?: StartTaskOutcome): void
  readonly startRequestCount: () => number
  readonly lastStartRequest: () => StartTaskRequest | null
}

let observationSeq = 0

export function createMockEngine(
  initialScenario: ScenarioId = 'populated',
): MockEngineControls {
  let scenario = scenarioById(initialScenario)
  let startCount = 0
  let lastStart: StartTaskRequest | null = null
  let heldStart: ControllablePromise<StartTaskOutcome> | null = null
  const contextListeners = new Set<(load: ContextLoad) => void>()

  function emitContext(load: ContextLoad): void {
    for (const listener of contextListeners) listener(load)
  }

  function currentContext(): ContextLoad {
    if (scenario.context === 'defer') {
      return { kind: 'loading' }
    }
    return scenario.context
  }

  const engine: EnginePort = {
    observeContext(onUpdate) {
      const id = asObservationId(`obs-${++observationSeq}`)
      let active = true
      const wrapped = (load: ContextLoad) => {
        if (active) onUpdate(load)
      }
      contextListeners.add(wrapped)
      queueMicrotask(() => {
        if (active) onUpdate(currentContext())
      })
      const handle: ObservationHandle = {
        id,
        cancel() {
          active = false
          contextListeners.delete(wrapped)
        },
      }
      return handle
    },
    async startTask(request) {
      startCount += 1
      lastStart = request
      if (scenario.holdStart) {
        heldStart = createControllablePromise<StartTaskOutcome>()
        return heldStart.promise
      }
      return scenario.startOutcome
    },
  }

  return {
    engine,
    setScenario(id) {
      scenario = scenarioById(id)
      heldStart = null
      emitContext(currentContext())
    },
    publishContext(load) {
      emitContext(load)
    },
    resolveHeldStart(outcome) {
      const target = heldStart
      heldStart = null
      target?.resolve(outcome ?? scenario.startOutcome)
    },
    startRequestCount() {
      return startCount
    },
    lastStartRequest() {
      return lastStart
    },
  }
}
