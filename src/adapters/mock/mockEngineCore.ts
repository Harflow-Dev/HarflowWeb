import type { EnginePort } from '../../application'
import {
  taskChangesEntryKey,
  type ContextLoad,
  type HarnessesLoad,
  type NeedsYouLoad,
  type ParallelGroupId,
  type ParallelGroupLoad,
  type PendingLaunchCapabilityLoad,
  type PendingLaunchId,
  type PendingLaunchInventoryLoad,
  type PendingLaunchStatusLoad,
  type ResourcesLoad,
  type SettingsGeneralLoad,
  type StartTaskOutcome,
  type StartTaskRequest,
  type StatisticsLoad,
  type StatisticsRangeId,
  type TaskChangesLoad,
  type TaskChangesQuery,
  type TaskEventsLoad,
  type TaskEventsQuery,
  type TaskId,
  type TaskLoad,
  type WorkflowEditorLoad,
  type WorkflowId,
  type WorkflowRunContextLoad,
  type WorkflowRunId,
  type WorkflowRunLoad,
  type WorkflowsLoad,
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
import { taskEventsLoadFor } from './taskEventsFixtures'
import { taskLoadFor } from './taskFixtures'
import { workflowEditorLoadFor } from './workflowEditorFixtures'
import {
  deferredParallelGroupLoading,
  parallelGroupLoadFor,
} from './parallelGroupFixtures'
import {
  pendingCapabilitySupported,
  pendingCapabilityUnsupported,
  pendingInventoryReady,
  pendingStatusLoadFor,
} from './pendingLaunchFixtures'
import { workflowExecutionLoadFor } from './workflowExecutionFixtures'
import { workflowRunLoadFor } from './workflowRunFixtures'

export type TaskChangesKey = string
export type TaskEventsKey = string

export function taskEventsKey(query: TaskEventsQuery): TaskEventsKey {
  return query.taskId
}

export function taskChangesKey(query: TaskChangesQuery): TaskChangesKey {
  const turn = query.turnTaskId ?? ''
  return `${query.taskId}\0${turn}\0${taskChangesEntryKey(query.selectedEntry)}`
}

export type MockListenerSets = {
  readonly context: Set<(load: ContextLoad) => void>
  readonly workflows: Set<(load: WorkflowsLoad) => void>
  readonly resources: Set<(load: ResourcesLoad) => void>
  readonly statistics: Set<KeyedListener<StatisticsRangeId, StatisticsLoad>>
  readonly tasks: Set<KeyedListener<TaskId, TaskLoad>>
  readonly taskChanges: Set<KeyedListener<TaskChangesKey, TaskChangesLoad>>
  readonly taskEvents: Set<KeyedListener<TaskEventsKey, TaskEventsLoad>>
  readonly harnesses: Set<(load: HarnessesLoad) => void>
  readonly settingsGeneral: Set<(load: SettingsGeneralLoad) => void>
  readonly needsYou: Set<(load: NeedsYouLoad) => void>
  readonly workflowRuns: Set<KeyedListener<WorkflowId, WorkflowRunContextLoad>>
  readonly workflowEditors: Set<KeyedListener<WorkflowId, WorkflowEditorLoad>>
  readonly workflowExecutions: Set<KeyedListener<WorkflowRunId, WorkflowRunLoad>>
  readonly parallelGroups: Set<KeyedListener<ParallelGroupId, ParallelGroupLoad>>
  readonly pendingCapability: Set<(load: PendingLaunchCapabilityLoad) => void>
  readonly pendingInventory: Set<(load: PendingLaunchInventoryLoad) => void>
  readonly pendingStatus: Set<
    KeyedListener<PendingLaunchId, PendingLaunchStatusLoad>
  >
}

export function createListenerSets(): MockListenerSets {
  return {
    context: new Set(),
    workflows: new Set(),
    resources: new Set(),
    statistics: new Set(),
    tasks: new Set(),
    taskChanges: new Set(),
    taskEvents: new Set(),
    harnesses: new Set(),
    settingsGeneral: new Set(),
    needsYou: new Set(),
    workflowRuns: new Set(),
    workflowEditors: new Set(),
    workflowExecutions: new Set(),
    parallelGroups: new Set(),
    pendingCapability: new Set(),
    pendingInventory: new Set(),
    pendingStatus: new Set(),
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

export function resolveTaskEventsLoad(
  scenario: ScenarioDefinition,
  query: TaskEventsQuery,
): TaskEventsLoad {
  if (scenario.taskEvents === 'defer') return { kind: 'loading' }
  if (scenario.taskEvents === 'default') return taskEventsLoadFor(query)
  return scenario.taskEvents(query)
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
    observeTaskEvents(query, onUpdate) {
      return createKeyedObservation(
        listeners.taskEvents,
        taskEventsKey(query),
        onUpdate,
        () => resolveTaskEventsLoad(getScenario(), query),
      )
    },
    observeWorkflowRun(workflowId, onUpdate) {
      return createKeyedObservation(
        listeners.workflowRuns,
        workflowId,
        onUpdate,
        (id) => workflowRunLoadFor(id),
      )
    },
    observeWorkflowEditor(workflowId, onUpdate) {
      return createKeyedObservation(
        listeners.workflowEditors,
        workflowId,
        onUpdate,
        (id): WorkflowEditorLoad => {
          const scenario = getScenario()
          if (scenario.workflowEditors === 'defer') {
            return { kind: 'loading' }
          }
          return workflowEditorLoadFor(id)
        },
      )
    },
    observeWorkflowExecution(runId, onUpdate) {
      return createKeyedObservation(
        listeners.workflowExecutions,
        runId,
        onUpdate,
        (id): WorkflowRunLoad => {
          const scenario = getScenario()
          if (scenario.workflowExecutions === 'defer') {
            return { kind: 'loading' }
          }
          return workflowExecutionLoadFor(id)
        },
      )
    },
    observeParallelGroup(groupId, onUpdate) {
      return createKeyedObservation(
        listeners.parallelGroups,
        groupId,
        onUpdate,
        (id): ParallelGroupLoad => {
          const scenario = getScenario()
          if (scenario.parallelGroups === 'defer') {
            return deferredParallelGroupLoading(id)
          }
          return parallelGroupLoadFor(id)
        },
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
    observeSettingsGeneral(onUpdate) {
      return createObservation(listeners.settingsGeneral, onUpdate, () => {
        const scenario = getScenario()
        const load: SettingsGeneralLoad =
          scenario.settingsGeneral === 'defer'
            ? { kind: 'loading' }
            : scenario.settingsGeneral
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
    observePendingLaunchCapability(onUpdate) {
      return createObservation(listeners.pendingCapability, onUpdate, () => {
        const scenario = getScenario()
        const load: PendingLaunchCapabilityLoad =
          scenario.pendingLaunchCapability === 'defer'
            ? { kind: 'loading' }
            : scenario.pendingLaunchCapability
              ? pendingCapabilitySupported()
              : pendingCapabilityUnsupported()
        return load
      })
    },
    observePendingLaunchInventory(onUpdate) {
      return createObservation(listeners.pendingInventory, onUpdate, () => {
        const scenario = getScenario()
        const load: PendingLaunchInventoryLoad =
          scenario.pendingLaunchInventory === 'defer'
            ? { kind: 'loading' }
            : scenario.pendingLaunchInventory === 'default'
              ? pendingInventoryReady()
              : scenario.pendingLaunchInventory
        return load
      })
    },
    observePendingLaunchStatus(launchId, onUpdate) {
      return createKeyedObservation(
        listeners.pendingStatus,
        launchId,
        onUpdate,
        (id): PendingLaunchStatusLoad => {
          const scenario = getScenario()
          return pendingStatusLoadFor(
            id,
            scenario.pendingLaunchStatus,
            scenario.seed?.openPendingLaunchId,
          )
        },
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
