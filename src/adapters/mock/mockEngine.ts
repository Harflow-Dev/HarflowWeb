import type { EnginePort } from '../../application'
import {
  asTaskId,
  type ContextLoad,
  type HarnessesLoad,
  type NeedsYouLoad,
  type ResourcesLoad,
  type StartTaskOutcome,
  type StartTaskRequest,
  type StatisticsLoad,
  type StatisticsRangeId,
  type TaskChangesLoad,
  type TaskChangesQuery,
  type TaskId,
  type TaskLoad,
  type WorkflowsLoad,
} from '../../model'
import {
  buildMockEnginePort,
  createHeldStartTracker,
  createListenerSets,
  resolveStatisticsLoad,
  resolveTaskChangesLoad,
  resolveTaskLoad,
  taskChangesKey,
  type MockListenerSets,
} from './mockEngineCore'
import { scenarioById, type ScenarioDefinition, type ScenarioId } from './scenarios'

export type MockEngineControls = {
  readonly engine: EnginePort
  setScenario(id: ScenarioId): void
  publishContext(load: ContextLoad): void
  publishWorkflows(load: WorkflowsLoad): void
  publishResources(load: ResourcesLoad): void
  publishStatistics(range: StatisticsRangeId, load: StatisticsLoad): void
  publishTask(taskId: TaskId, load: TaskLoad): void
  publishTaskChanges(query: TaskChangesQuery, load: TaskChangesLoad): void
  publishHarnesses(load: HarnessesLoad): void
  publishNeedsYou(load: NeedsYouLoad): void
  resolveHeldStart(outcome?: StartTaskOutcome): void
  readonly startRequestCount: () => number
  readonly lastStartRequest: () => StartTaskRequest | null
}

function queryFromChangesKey(key: string): TaskChangesQuery {
  const sep = key.indexOf('\0')
  return {
    taskId: asTaskId(key.slice(0, sep)),
    selectedPath: key.slice(sep + 1) === '' ? null : key.slice(sep + 1),
  }
}

function republishScenario(
  scenario: ScenarioDefinition,
  listeners: MockListenerSets,
): void {
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
  for (const listener of listeners.taskChanges) {
    listener.send(
      resolveTaskChangesLoad(scenario, queryFromChangesKey(listener.key)),
    )
  }
  for (const listener of listeners.harnesses) {
    listener(
      scenario.harnesses === 'defer'
        ? { kind: 'loading' }
        : scenario.harnesses,
    )
  }
  for (const listener of listeners.needsYou) {
    listener(
      scenario.needsYou === 'defer' ? { kind: 'loading' } : scenario.needsYou,
    )
  }
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
      republishScenario(scenario, listeners)
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
    publishHarnesses(load) {
      for (const listener of listeners.harnesses) listener(load)
    },
    publishNeedsYou(load) {
      for (const listener of listeners.needsYou) listener(load)
    },
    publishTaskChanges(query, load) {
      const key = taskChangesKey(query)
      for (const listener of listeners.taskChanges) {
        if (listener.key === key) listener.send(load)
      }
    },
    resolveHeldStart(outcome) {
      held.take()?.resolve(outcome ?? scenario.startOutcome)
    },
    startRequestCount: () => startCount,
    lastStartRequest: () => lastStart,
  }
}
