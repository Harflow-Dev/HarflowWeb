import type { EnginePort } from '../../application'
import type {
  ContextLoad,
  HarnessesLoad,
  NeedsYouLoad,
  ResourcesLoad,
  StartTaskOutcome,
  StartTaskRequest,
  StatisticsLoad,
  StatisticsRangeId,
  TaskChangesLoad,
  TaskChangesQuery,
  TaskId,
  TaskLoad,
  WorkflowsLoad,
} from '../../model'
import { createControllablePromise, type ControllablePromise } from './controllable'
import {
  createKeyedObservation,
  createObservation,
  type KeyedListener,
} from './mockObservation'
import type { ScenarioDefinition } from './scenarios'
import { statisticsLoadFor } from './statisticsFixtures'
import { taskChangesLoadFor } from './taskChangesFixtures'
import { taskLoadFor } from './taskFixtures'

export type TaskChangesKey = string

export function taskChangesKey(query: TaskChangesQuery): TaskChangesKey {
  return `${query.taskId}\0${query.selectedPath ?? ''}`
}

export type MockListenerSets = {
  readonly context: Set<(load: ContextLoad) => void>
  readonly workflows: Set<(load: WorkflowsLoad) => void>
  readonly resources: Set<(load: ResourcesLoad) => void>
  readonly statistics: Set<KeyedListener<StatisticsRangeId, StatisticsLoad>>
  readonly tasks: Set<KeyedListener<TaskId, TaskLoad>>
  readonly taskChanges: Set<KeyedListener<TaskChangesKey, TaskChangesLoad>>
  readonly harnesses: Set<(load: HarnessesLoad) => void>
  readonly needsYou: Set<(load: NeedsYouLoad) => void>
}

export function createListenerSets(): MockListenerSets {
  return {
    context: new Set(),
    workflows: new Set(),
    resources: new Set(),
    statistics: new Set(),
    tasks: new Set(),
    taskChanges: new Set(),
    harnesses: new Set(),
    needsYou: new Set(),
  }
}

export function resolveStatisticsLoad(
  scenario: ScenarioDefinition,
  range: StatisticsRangeId,
): StatisticsLoad {
  if (scenario.statistics === 'defer') return { kind: 'loading' }
  if (scenario.statistics === 'default') return statisticsLoadFor(range)
  return scenario.statistics(range)
}

export function resolveTaskLoad(
  scenario: ScenarioDefinition,
  taskId: TaskId,
): TaskLoad {
  if (scenario.tasks === 'defer') return { kind: 'loading' }
  if (scenario.tasks === 'default') return taskLoadFor(taskId)
  return scenario.tasks(taskId)
}

export function resolveTaskChangesLoad(
  scenario: ScenarioDefinition,
  query: TaskChangesQuery,
): TaskChangesLoad {
  if (scenario.taskChanges === 'defer') return { kind: 'loading' }
  if (scenario.taskChanges === 'default') return taskChangesLoadFor(query)
  return scenario.taskChanges(query)
}

export function buildMockEnginePort(options: {
  readonly getScenario: () => ScenarioDefinition
  readonly listeners: MockListenerSets
  readonly onStart: (request: StartTaskRequest) => Promise<StartTaskOutcome>
}): EnginePort {
  const { getScenario, listeners, onStart } = options
  return {
    observeContext(onUpdate) {
      return createObservation(listeners.context, onUpdate, () => {
        const scenario = getScenario()
        const load: ContextLoad =
          scenario.context === 'defer'
            ? { kind: 'loading' }
            : scenario.context
        return load
      })
    },
    observeWorkflows(onUpdate) {
      return createObservation(listeners.workflows, onUpdate, () => {
        const scenario = getScenario()
        const load: WorkflowsLoad =
          scenario.workflows === 'defer'
            ? { kind: 'loading' }
            : scenario.workflows
        return load
      })
    },
    observeResources(onUpdate) {
      return createObservation(listeners.resources, onUpdate, () => {
        const scenario = getScenario()
        const load: ResourcesLoad =
          scenario.resources === 'defer'
            ? { kind: 'loading' }
            : scenario.resources
        return load
      })
    },
    observeStatistics(range, onUpdate) {
      return createKeyedObservation(
        listeners.statistics,
        range,
        onUpdate,
        (r) => resolveStatisticsLoad(getScenario(), r),
      )
    },
    observeTask(taskId, onUpdate) {
      return createKeyedObservation(
        listeners.tasks,
        taskId,
        onUpdate,
        (id) => resolveTaskLoad(getScenario(), id),
      )
    },
    observeTaskChanges(query, onUpdate) {
      return createKeyedObservation(
        listeners.taskChanges,
        taskChangesKey(query),
        onUpdate,
        () => resolveTaskChangesLoad(getScenario(), query),
      )
    },
    observeHarnesses(onUpdate) {
      return createObservation(listeners.harnesses, onUpdate, () => {
        const scenario = getScenario()
        const load: HarnessesLoad =
          scenario.harnesses === 'defer'
            ? { kind: 'loading' }
            : scenario.harnesses
        return load
      })
    },
    observeNeedsYou(onUpdate) {
      return createObservation(listeners.needsYou, onUpdate, () => {
        const scenario = getScenario()
        const load: NeedsYouLoad =
          scenario.needsYou === 'defer' ? { kind: 'loading' } : scenario.needsYou
        return load
      })
    },
    startTask(request) {
      return onStart(request)
    },
  }
}

export function createHeldStartTracker(): {
  hold: ControllablePromise<StartTaskOutcome> | null
  begin(): ControllablePromise<StartTaskOutcome>
  take(): ControllablePromise<StartTaskOutcome> | null
} {
  let hold: ControllablePromise<StartTaskOutcome> | null = null
  return {
    get hold() {
      return hold
    },
    begin() {
      hold = createControllablePromise<StartTaskOutcome>()
      return hold
    },
    take() {
      const current = hold
      hold = null
      return current
    },
  }
}
