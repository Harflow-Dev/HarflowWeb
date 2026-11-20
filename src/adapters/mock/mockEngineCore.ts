import {
  taskChangesEntryKey,
  type ContextLoad,
  type HarnessesLoad,
  type NeedsYouLoad,
  type ParallelGroupId,
  type ParallelGroupLoad,
  type MessagingCapabilityLoad,
  type PendingLaunchCapabilityLoad,
  type PendingLaunchId,
  type PendingLaunchInventoryLoad,
  type PendingLaunchStatusLoad,
  type ResourcesLoad,
  type SettingsGeneralLoad,
  type StartTaskOutcome,
  type StatisticsLoad,
  type StatisticsRangeId,
  type TaskChangesLoad,
  type TaskChangesQuery,
  type TaskEventsLoad,
  type TaskEventsQuery,
  type TaskId,
  type TaskLoad,
  type WorkflowId,
  type WorkflowRunContextLoad,
  type WorkflowRunId,
  type WorkflowRunLoad,
  type WorkflowsLoad,
  type WorkflowEditorLoad,
} from '../../model'
import { createControllablePromise, type ControllablePromise } from './controllable'
import { type KeyedListener } from './mockObservation'
import type { ScenarioDefinition } from './scenarios'
import { statisticsLoadFor } from './statisticsFixtures'
import { taskChangesLoadFor } from './taskChangesFixtures'
import { taskEventsLoadFor } from './taskEventsFixtures'
import { taskLoadFor } from './taskFixtures'

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
  readonly messagingCapability: Set<(load: MessagingCapabilityLoad) => void>
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
    messagingCapability: new Set(),
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
