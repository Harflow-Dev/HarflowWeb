import type { EnginePort } from '../../application'
import {
  asObservationId,
  type ContextLoad,
  type ObservationHandle,
  type StartTaskOutcome,
  type StartTaskRequest,
  type WorkflowsLoad,
} from '../../model'
import { createControllablePromise, type ControllablePromise } from './controllable'
import { scenarioById, type ScenarioId } from './scenarios'

export type MockEngineControls = {
  readonly engine: EnginePort
  setScenario(id: ScenarioId): void
  /** Publish a deferred/held context update (for stale tests). */
  publishContext(load: ContextLoad): void
  /** Publish a workflows list update (for stale/nav tests). */
  publishWorkflows(load: WorkflowsLoad): void
  /** Resolve the outstanding held startTask, if any. */
  resolveHeldStart(outcome?: StartTaskOutcome): void
  readonly startRequestCount: () => number
  readonly lastStartRequest: () => StartTaskRequest | null
}

let observationSeq = 0

function createObservation<T>(
  listeners: Set<(load: T) => void>,
  onUpdate: (load: T) => void,
  current: () => T,
): ObservationHandle {
  const id = asObservationId(`obs-${++observationSeq}`)
  let active = true
  const wrapped = (load: T) => {
    if (active) onUpdate(load)
  }
  listeners.add(wrapped)
  queueMicrotask(() => {
    if (active) onUpdate(current())
  })
  return {
    id,
    cancel() {
      active = false
      listeners.delete(wrapped)
    },
  }
}

export function createMockEngine(
  initialScenario: ScenarioId = 'populated',
): MockEngineControls {
  let scenario = scenarioById(initialScenario)
  let startCount = 0
  let lastStart: StartTaskRequest | null = null
  let heldStart: ControllablePromise<StartTaskOutcome> | null = null
  const contextListeners = new Set<(load: ContextLoad) => void>()
  const workflowListeners = new Set<(load: WorkflowsLoad) => void>()

  function emitContext(load: ContextLoad): void {
    for (const listener of contextListeners) listener(load)
  }

  function emitWorkflows(load: WorkflowsLoad): void {
    for (const listener of workflowListeners) listener(load)
  }

  function currentContext(): ContextLoad {
    if (scenario.context === 'defer') {
      return { kind: 'loading' }
    }
    return scenario.context
  }

  function currentWorkflows(): WorkflowsLoad {
    if (scenario.workflows === 'defer') {
      return { kind: 'loading' }
    }
    return scenario.workflows
  }

  const engine: EnginePort = {
    observeContext(onUpdate) {
      return createObservation(contextListeners, onUpdate, currentContext)
    },
    observeWorkflows(onUpdate) {
      return createObservation(workflowListeners, onUpdate, currentWorkflows)
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
      emitWorkflows(currentWorkflows())
    },
    publishContext(load) {
      emitContext(load)
    },
    publishWorkflows(load) {
      emitWorkflows(load)
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
