import type { EnginePort } from '../../application'
import {
  type ContextLoad,
  type ResourcesLoad,
  type StartTaskOutcome,
  type StartTaskRequest,
  type StatisticsLoad,
  type StatisticsRangeId,
  type TaskId,
  type TaskLoad,
  type WorkflowsLoad,
} from '../../model'
import {
  buildMockEnginePort,
  createHeldStartTracker,
  createListenerSets,
  resolveStatisticsLoad,
  resolveTaskLoad,
} from './mockEngineCore'
import { scenarioById, type ScenarioId } from './scenarios'

export type MockEngineControls = {
  readonly engine: EnginePort
  setScenario(id: ScenarioId): void
  publishContext(load: ContextLoad): void
  publishWorkflows(load: WorkflowsLoad): void
  publishResources(load: ResourcesLoad): void
  publishStatistics(range: StatisticsRangeId, load: StatisticsLoad): void
  publishTask(taskId: TaskId, load: TaskLoad): void
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
  const held = createHeldStartTracker()
  const listeners = createListenerSets()

  const engine = buildMockEnginePort({
    getScenario: () => scenario,
    listeners,
    async onStart(request) {
      startCount += 1
      lastStart = request
      if (scenario.holdStart) return held.begin().promise
      return scenario.startOutcome
    },
  })

  return {
    engine,
    setScenario(id) {
      scenario = scenarioById(id)
      held.take()
      for (const listener of listeners.context) {
        listener(
          scenario.context === 'defer' ? { kind: 'loading' } : scenario.context,
        )
      }
      for (const listener of listeners.workflows) {
        listener(
          scenario.workflows === 'defer'
            ? { kind: 'loading' }
            : scenario.workflows,
        )
      }
      for (const listener of listeners.resources) {
        listener(
          scenario.resources === 'defer'
            ? { kind: 'loading' }
            : scenario.resources,
        )
      }
      for (const listener of listeners.statistics) {
        listener.send(resolveStatisticsLoad(scenario, listener.key))
      }
      for (const listener of listeners.tasks) {
        listener.send(resolveTaskLoad(scenario, listener.key))
      }
    },
    publishContext(load) {
      for (const listener of listeners.context) listener(load)
    },
    publishWorkflows(load) {
      for (const listener of listeners.workflows) listener(load)
    },
    publishResources(load) {
      for (const listener of listeners.resources) listener(load)
    },
    publishStatistics(range, load) {
      for (const listener of listeners.statistics) {
        if (listener.key === range) listener.send(load)
      }
    },
    publishTask(taskId, load) {
      for (const listener of listeners.tasks) {
        if (listener.key === taskId) listener.send(load)
      }
    },
    resolveHeldStart(outcome) {
      held.take()?.resolve(outcome ?? scenario.startOutcome)
    },
    startRequestCount: () => startCount,
    lastStartRequest: () => lastStart,
  }
}
