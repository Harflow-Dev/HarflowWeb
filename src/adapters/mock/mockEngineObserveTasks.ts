import type {
  StatisticsRangeId,
  TaskChangesQuery,
  TaskEventsQuery,
  TaskId,
  TaskLoad,
} from '../../model'
import {
  createKeyedObservation,
  createOneShotObservation,
} from './mockObservation'
import { taskEventsOlderLoadFor } from './taskEventsFixtures'
import {
  resolveStatisticsLoad,
  resolveTaskChangesLoad,
  resolveTaskEventsLoad,
  taskChangesKey,
  taskEventsKey,
} from './mockEngineCore'
import type { MockEngineObserveOptions } from './mockEngineObserve'

export function mockObserveStatisticsSurface(options: MockEngineObserveOptions) {
  const { getScenario, listeners } = options
  return {
    observeStatistics(
      range: StatisticsRangeId,
      onUpdate: (load: import('../../model').StatisticsLoad) => void,
    ) {
      return createKeyedObservation(
        listeners.statistics,
        range,
        onUpdate,
        (r) => resolveStatisticsLoad(getScenario(), r),
      )
    },
  }
}

export function mockObserveTaskEventSurfaces(options: MockEngineObserveOptions) {
  const { getScenario, listeners, resolveTask } = options
  return {
    observeTask(taskId: TaskId, onUpdate: (load: TaskLoad) => void) {
      return createKeyedObservation(
        listeners.tasks,
        taskId,
        onUpdate,
        (id) => resolveTask(id),
      )
    },
    observeTaskChanges(
      query: TaskChangesQuery,
      onUpdate: (load: import('../../model').TaskChangesLoad) => void,
    ) {
      return createKeyedObservation(
        listeners.taskChanges,
        taskChangesKey(query),
        onUpdate,
        () => resolveTaskChangesLoad(getScenario(), query),
      )
    },
    observeTaskEvents(
      query: TaskEventsQuery,
      onUpdate: (load: import('../../model').TaskEventsLoad) => void,
    ) {
      return createKeyedObservation(
        listeners.taskEvents,
        taskEventsKey(query),
        onUpdate,
        () => resolveTaskEventsLoad(getScenario(), query),
      )
    },
    observeTaskEventsOlder(
      query: import('../../model').TaskEventsOlderQuery,
      onUpdate: (load: import('../../model').TaskEventsOlderLoad) => void,
    ) {
      return createOneShotObservation(onUpdate, () =>
        taskEventsOlderLoadFor(query),
      )
    },
  }
}