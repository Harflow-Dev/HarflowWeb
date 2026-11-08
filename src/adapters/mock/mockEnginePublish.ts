import { asTaskId } from '../../model'
import type {
  ContextLoad,
  HarnessesLoad,
  NeedsYouLoad,
  ParallelGroupId,
  ParallelGroupLoad,
  ResourcesLoad,
  StatisticsLoad,
  StatisticsRangeId,
  TaskChangesLoad,
  TaskChangesQuery,
  TaskId,
  TaskLoad,
  WorkflowEditorLoad,
  WorkflowId,
  WorkflowRunContextLoad,
  WorkflowsLoad,
} from '../../model'
import {
  resolveStatisticsLoad,
  resolveTaskChangesLoad,
  resolveTaskLoad,
  taskChangesKey,
  type MockListenerSets,
} from './mockEngineCore'
import { parallelGroupLoadFor } from './parallelGroupFixtures'
import type { ScenarioDefinition } from './scenarios'
import { workflowEditorLoadFor } from './workflowEditorFixtures'
import { workflowExecutionLoadFor } from './workflowExecutionFixtures'
import { workflowRunLoadFor } from './workflowRunFixtures'

function queryFromChangesKey(key: string): TaskChangesQuery {
  const sep = key.indexOf('\0')
  return {
    taskId: asTaskId(key.slice(0, sep)),
    selectedPath: key.slice(sep + 1) === '' ? null : key.slice(sep + 1),
  }
}

function republishCatalog(
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
}

function republishTasks(
  scenario: ScenarioDefinition,
  listeners: MockListenerSets,
): void {
  for (const listener of listeners.tasks) {
    listener.send(resolveTaskLoad(scenario, listener.key))
  }
  for (const listener of listeners.taskChanges) {
    listener.send(
      resolveTaskChangesLoad(scenario, queryFromChangesKey(listener.key)),
    )
  }
}

function republishSurfaces(
  scenario: ScenarioDefinition,
  listeners: MockListenerSets,
): void {
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
  for (const listener of listeners.workflowRuns) {
    listener.send(workflowRunLoadFor(listener.key))
  }
  for (const listener of listeners.workflowEditors) {
    listener.send(workflowEditorLoadFor(listener.key))
  }
  for (const listener of listeners.workflowExecutions) {
    listener.send(workflowExecutionLoadFor(listener.key))
  }
  for (const listener of listeners.parallelGroups) {
    listener.send(parallelGroupLoadFor(listener.key))
  }
}

export function republishScenario(
  scenario: ScenarioDefinition,
  listeners: MockListenerSets,
): void {
  republishCatalog(scenario, listeners)
  republishTasks(scenario, listeners)
  republishSurfaces(scenario, listeners)
}

export function catalogPublishers(listeners: MockListenerSets) {
  return {
    publishContext(load: ContextLoad) {
      for (const listener of listeners.context) listener(load)
    },
    publishWorkflows(load: WorkflowsLoad) {
      for (const listener of listeners.workflows) listener(load)
    },
    publishResources(load: ResourcesLoad) {
      for (const listener of listeners.resources) listener(load)
    },
    publishStatistics(range: StatisticsRangeId, load: StatisticsLoad) {
      for (const listener of listeners.statistics) {
        if (listener.key === range) listener.send(load)
      }
    },
    publishTask(taskId: TaskId, load: TaskLoad) {
      for (const listener of listeners.tasks) {
        if (listener.key === taskId) listener.send(load)
      }
    },
  }
}

export function surfacePublishers(listeners: MockListenerSets) {
  return {
    publishHarnesses(load: HarnessesLoad) {
      for (const listener of listeners.harnesses) listener(load)
    },
    publishNeedsYou(load: NeedsYouLoad) {
      for (const listener of listeners.needsYou) listener(load)
    },
    publishWorkflowRun(workflowId: WorkflowId, load: WorkflowRunContextLoad) {
      for (const listener of listeners.workflowRuns) {
        if (listener.key === workflowId) listener.send(load)
      }
    },
    publishWorkflowEditor(workflowId: WorkflowId, load: WorkflowEditorLoad) {
      for (const listener of listeners.workflowEditors) {
        if (listener.key === workflowId) listener.send(load)
      }
    },
    publishParallelGroup(groupId: ParallelGroupId, load: ParallelGroupLoad) {
      for (const listener of listeners.parallelGroups) {
        if (listener.key === groupId) listener.send(load)
      }
    },
    publishTaskChanges(query: TaskChangesQuery, load: TaskChangesLoad) {
      const key = taskChangesKey(query)
      for (const listener of listeners.taskChanges) {
        if (listener.key === key) listener.send(load)
      }
    },
  }
}
