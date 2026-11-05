import type { EnginePort } from '../../application'
import {
  type ContextLoad,
  type ResourcesLoad,
  type StartTaskOutcome,
  type StartTaskRequest,
  type WorkflowsLoad,
} from '../../model'
import { createControllablePromise, type ControllablePromise } from './controllable'
import { createObservation } from './mockObservation'
import { scenarioById, type ScenarioId } from './scenarios'

export type MockEngineControls = {
  readonly engine: EnginePort
  setScenario(id: ScenarioId): void
  publishContext(load: ContextLoad): void
  publishWorkflows(load: WorkflowsLoad): void
  publishResources(load: ResourcesLoad): void
  resolveHeldStart(outcome?: StartTaskOutcome): void
  readonly startRequestCount: () => number
  readonly lastStartRequest: () => StartTaskRequest | null
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
  const resourceListeners = new Set<(load: ResourcesLoad) => void>()

  function currentContext(): ContextLoad {
    if (scenario.context === 'defer') return { kind: 'loading' }
    return scenario.context
  }

  function currentWorkflows(): WorkflowsLoad {
    if (scenario.workflows === 'defer') return { kind: 'loading' }
    return scenario.workflows
  }

  function currentResources(): ResourcesLoad {
    if (scenario.resources === 'defer') return { kind: 'loading' }
    return scenario.resources
  }

  const engine: EnginePort = {
    observeContext(onUpdate) {
      return createObservation(contextListeners, onUpdate, currentContext)
    },
    observeWorkflows(onUpdate) {
      return createObservation(workflowListeners, onUpdate, currentWorkflows)
    },
    observeResources(onUpdate) {
      return createObservation(resourceListeners, onUpdate, currentResources)
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
      for (const listener of contextListeners) listener(currentContext())
      for (const listener of workflowListeners) listener(currentWorkflows())
      for (const listener of resourceListeners) listener(currentResources())
    },
    publishContext(load) {
      for (const listener of contextListeners) listener(load)
    },
    publishWorkflows(load) {
      for (const listener of workflowListeners) listener(load)
    },
    publishResources(load) {
      for (const listener of resourceListeners) listener(load)
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
