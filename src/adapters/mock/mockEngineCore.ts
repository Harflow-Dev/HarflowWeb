import type { EnginePort } from '../../application'
import type {
  ContextLoad,
  ResourcesLoad,
  StartTaskOutcome,
  StartTaskRequest,
  StatisticsLoad,
  StatisticsRangeId,
  WorkflowsLoad,
} from '../../model'
import { createControllablePromise, type ControllablePromise } from './controllable'
import { createObservation, createRangedObservation } from './mockObservation'
import type { ScenarioDefinition } from './scenarios'
import { statisticsLoadFor } from './statisticsFixtures'

export type MockListenerSets = {
  readonly context: Set<(load: ContextLoad) => void>
  readonly workflows: Set<(load: WorkflowsLoad) => void>
  readonly resources: Set<(load: ResourcesLoad) => void>
  readonly statistics: Set<{
    range: StatisticsRangeId
    send: (load: StatisticsLoad) => void
  }>
}

export function createListenerSets(): MockListenerSets {
  return {
    context: new Set(),
    workflows: new Set(),
    resources: new Set(),
    statistics: new Set(),
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
      return createRangedObservation(
        listeners.statistics,
        range,
        onUpdate,
        (r) => resolveStatisticsLoad(getScenario(), r),
      )
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
